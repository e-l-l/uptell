from fastapi import APIRouter, Depends, HTTPException, Path, Query
from typing import List

from routes.schemas.maintainance import Maintenance, MaintenanceCreate, MaintenanceUpdate
from ..dependencies import get_supabase
from websocket_manager import manager
from utils.notification_service import send_org_notification
import asyncio
router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

from fastapi.encoders import jsonable_encoder

@router.post("", response_model=Maintenance)
async def create_maintenance(payload: MaintenanceCreate, supabase=Depends(get_supabase)):
    # Convert the payload to a JSON-serializable format
    serialized_payload = jsonable_encoder(payload)
    
    res = supabase.table("maintenance").insert(serialized_payload).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create maintenance")
    
    user = supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", payload.org_id).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**res.data[0])
    
    # Broadcast the new maintenance event
    asyncio.create_task(manager.broadcast(
        {
            "type": "new_maintenance",
            "data": maintenance.model_dump(),
            "user_id": user.id
        },
        org_id=payload.org_id
    ))
    
    # Send email notification
    asyncio.create_task(send_org_notification(
        org_id=payload.org_id,
        action="created",
        entity_type="Maintenance",
        entity_name=res.data[0]["title"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Scheduled from {res.data[0]['start_time']} to {res.data[0]['end_time']}",
        exclude_user_id=user.id
    ))
    
    return maintenance

@router.get("", response_model=List[Maintenance])
def list_all_maintenance(org_id: str = Query(...), supabase=Depends(get_supabase)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    res = supabase.table("maintenance").select("*").eq("org_id", org_id).execute()
    if not res.data:
        return []
    
    # Create Maintenance model instances to ensure proper datetime serialization
    return [Maintenance(**item) for item in res.data]

@router.get("/app/{app_id}", response_model=List[Maintenance])
def list_app_maintenance(app_id: str = Path(...), supabase=Depends(get_supabase)):
    if not app_id:
        raise HTTPException(status_code=400, detail="Application ID is required")
    
    res = supabase.table("maintenance").select("*").eq("app_id", app_id).execute()
    if not res.data:
        return []
    
    # Create Maintenance model instances to ensure proper datetime serialization
    return [Maintenance(**item) for item in res.data]

@router.patch("/{id}", response_model=Maintenance)
async def update_maintenance(id: str, payload: MaintenanceUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Convert the update data to a JSON-serializable format
    serialized_update_data = jsonable_encoder(update_data)
    
    res = supabase.table("maintenance").update(serialized_update_data).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    
    user = supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**res.data[0])
    
    asyncio.create_task(manager.broadcast({"type": "updated_maintenance", "data": maintenance.model_dump(), "user_id": user.id}, org_id=res.data[0]["org_id"]))
    
    # Send email notification
    asyncio.create_task(send_org_notification(
        org_id=res.data[0]["org_id"],
        action="updated",
        entity_type="Maintenance",
        entity_name=res.data[0]["title"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Status: {res.data[0]['status']}",
        exclude_user_id=user.id
    ))
    
    return maintenance

@router.delete("/{id}")
async def delete_maintenance(id: str, supabase=Depends(get_supabase)):
    res = supabase.table("maintenance").delete().eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    
    user = supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    asyncio.create_task(manager.broadcast({"type": "deleted_maintenance", "data": {"id": id}, "user_id": user.id}, org_id=res.data[0]["org_id"]))
    
    # Send email notification
    asyncio.create_task(send_org_notification(
        org_id=res.data[0]["org_id"],
        action="deleted",
        entity_type="Maintenance",
        entity_name=res.data[0]["title"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id
    ))
    
    return {"message": "Maintenance deleted successfully"} 