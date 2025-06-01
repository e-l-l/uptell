from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from ..schemas import Incident, IncidentCreate, IncidentUpdate
from ..dependencies import get_supabase
from . import logs
from .utils import (
    send_incident_create_notifications,
    send_incident_update_notifications,
    send_incident_delete_notifications
)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Include logs subrouter
router.include_router(logs.router, prefix="/{incident_id}")

@router.post("", response_model=Incident)
async def create_incident(payload: IncidentCreate, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create incident")
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", payload.org_id).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get application name
    app_res = supabase.table("apps").select("name").eq("id", payload.app_id).execute()
    application_name = app_res.data[0]["name"] if app_res.data else "Unknown Application"
    
    await send_incident_create_notifications(
        res.data[0], 
        payload.org_id, 
        org_name, 
        application_name, 
        supabase
    )
    
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
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get application name
    app_res = supabase.table("apps").select("name").eq("id", res.data[0]["app_id"]).execute()
    application_name = app_res.data[0]["name"] if app_res.data else "Unknown Application"
    
    await send_incident_update_notifications(
        res.data[0], 
        org_name, 
        application_name, 
        supabase
    )
    
    return res.data[0]

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").delete().eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    # Get application name
    app_res = supabase.table("apps").select("name").eq("id", res.data[0]["app_id"]).execute()
    application_name = app_res.data[0]["name"] if app_res.data else "Unknown Application"
    
    await send_incident_delete_notifications(
        res.data[0], 
        org_name, 
        application_name, 
        supabase
    )
    
    return {"message": "Incident deleted successfully"} 