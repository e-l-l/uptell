from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from ..schemas import Incident, IncidentCreate, IncidentUpdate
from ..dependencies import get_supabase
from . import logs
from websocket_manager import manager
from utils.notification_service import send_org_notification
import asyncio

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Include logs subrouter
router.include_router(logs.router, prefix="/{incident_id}")

@router.post("", response_model=Incident)
async def create_incident(payload: IncidentCreate, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create incident")
    
    user = supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", payload.org_id).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get application name
    app_res = supabase.table("apps").select("name").eq("id", payload.app_id).execute()
    application_name = app_res.data[0]["name"] if app_res.data else "Unknown Application"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    asyncio.create_task(manager.broadcast({"type": "new_incident", "data": res.data[0], "user_id": user.id}, org_id=payload.org_id))
    
    asyncio.create_task(send_org_notification(
        org_id=payload.org_id,
        action="created",
        entity_type="Incident",
        entity_name=res.data[0]["title"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Severity: {res.data[0]['severity']}",
        exclude_user_id=user.id,
        status=res.data[0]["status"],
        application_name=application_name,
        severity=res.data[0]["severity"]
    ))
    
    return res.data[0]

@router.get("", response_model=List[Incident])
def list_incidents(org_id: str = Query(...), supabase=Depends(get_supabase)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    res = supabase.table("incidents").select("*").eq("org_id", org_id).execute()
    if not res.data:
        return []
    return res.data

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").select("*").eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return res.data[0]

@router.patch("/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, payload: IncidentUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("incidents").update(update_data).eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    user = supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get application name
    app_res = supabase.table("apps").select("name").eq("id", res.data[0]["app_id"]).execute()
    application_name = app_res.data[0]["name"] if app_res.data else "Unknown Application"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    asyncio.create_task(manager.broadcast({"type": "updated_incident", "data": res.data[0], "user_id": user.id}, org_id=res.data[0]["org_id"]))
    
    asyncio.create_task(send_org_notification(
        org_id=res.data[0]["org_id"],
        action="updated",
        entity_type="Incident",
        entity_name=res.data[0]["title"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Status: {res.data[0]['status']}, Severity: {res.data[0]['severity']}",
        exclude_user_id=user.id,
        status=res.data[0]["status"],
        application_name=application_name,
        severity=res.data[0]["severity"]
    ))
    
    return res.data[0]

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").delete().eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    user = supabase.auth.get_user().user
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get application name
    app_res = supabase.table("apps").select("name").eq("id", res.data[0]["app_id"]).execute()
    application_name = app_res.data[0]["name"] if app_res.data else "Unknown Application"
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    asyncio.create_task(manager.broadcast({"type": "deleted_incident", "data": {"id": incident_id}, "user_id": user.id}, org_id=res.data[0]["org_id"]))
    
    asyncio.create_task(send_org_notification(
        org_id=res.data[0]["org_id"],
        action="deleted",
        entity_type="Incident",
        entity_name=res.data[0]["title"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        status=res.data[0]["status"],
        application_name=application_name,
        severity=res.data[0]["severity"]
    ))
    
    return {"message": "Incident deleted successfully"} 