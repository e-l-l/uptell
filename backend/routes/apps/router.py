from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import asyncio

from routes.apps import history
from ..schemas import Application, ApplicationCreate, ApplicationUpdate
from ..dependencies import get_supabase
from websocket_manager import manager
from utils.notification_service import send_org_notification
    
router = APIRouter(prefix="/applications", tags=["Applications"])
router.include_router(history.router, prefix="/{app_id}")
@router.post("", response_model=Application)
async def create_application(payload: ApplicationCreate, supabase=Depends(get_supabase)):
    res = supabase.table("apps").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create application")
    user=supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", payload.org_id).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification in background
    asyncio.create_task(manager.broadcast({"type": "new_app", "data": res.data[0], "user_id": user.id}, org_id=payload.org_id))
    
    asyncio.create_task(send_org_notification(
        org_id=payload.org_id,
        action="created",
        entity_type="Application",
        entity_name=res.data[0]["name"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id
    ))
    
    supabase.table("app_status_history").insert({
        "app_id": res.data[0]["id"],
        "status": res.data[0]["status"],
    }).execute()
    return res.data[0]

@router.get("", response_model=List[Application])
def list_applications(org_id: str = Query(...), supabase=Depends(get_supabase)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    res = supabase.table("apps").select("*").eq("org_id", org_id).execute()
    if not res.data:
        return []
    return res.data

@router.get("/{app_id}", response_model=Application)
def get_application(app_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("apps").select("*").eq("id", app_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return res.data[0]

@router.patch("/{app_id}", response_model=Application)
async def update_application(app_id: str, payload: ApplicationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("apps").update(update_data).eq("id", app_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    user=supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification in background
    asyncio.create_task(manager.broadcast({"type": "updated_app", "data": res.data[0], "user_id": user.id}, org_id=res.data[0]["org_id"]))
    
    asyncio.create_task(send_org_notification(
        org_id=res.data[0]["org_id"],
        action="updated",
        entity_type="Application",
        entity_name=res.data[0]["name"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Status changed to {res.data[0]['status']}" if 'status' in update_data else "",
        exclude_user_id=user.id
    ))
    
    supabase.table("app_status_history").insert({
        "app_id": res.data[0]["id"],
        "status": res.data[0]["status"],
    }).execute()
    return res.data[0]

@router.delete("/{app_id}")
async def delete_application(app_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("apps").delete().eq("id", app_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    user=supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification in background
    asyncio.create_task(manager.broadcast({"type": "deleted_app", "data": {"id": app_id}, "user_id": user.id}, org_id=res.data[0]["org_id"]))
    
    asyncio.create_task(send_org_notification(
        org_id=res.data[0]["org_id"],
        action="deleted",
        entity_type="Application",
        entity_name=res.data[0]["name"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id
    ))
    
    return {"message": "Application deleted successfully"} 