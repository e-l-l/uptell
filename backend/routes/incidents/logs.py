from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List
from ..schemas import Log, LogCreate, LogUpdate
from ..dependencies import get_supabase
from .utils import (
    send_log_create_notifications,
    send_log_update_notifications,
    send_log_delete_notifications
)

router = APIRouter(prefix="/logs", tags=["Incident Logs"])

@router.post("", response_model=Log)
async def create_log(incident_id: str, payload: LogCreate, supabase=Depends(get_supabase)):
    data = payload.model_dump()
    data["incident_id"] = incident_id  # Set incident_id from path parameter
    
    res = supabase.table("incident_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create log") 
    
    # Get the incident to find the org_id and title
    incident_res = supabase.table("incidents").select("title").eq("id", incident_id).execute()
    if not incident_res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    await send_log_create_notifications(
        res.data[0],
        incident_res.data[0]['title'],
        res.data[0]["org_id"],
        org_name,
        supabase
    )
    
    return res.data[0]

@router.get("", response_model=List[Log])
def list_logs(incident_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incident_logs").select("*").eq("incident_id", incident_id).execute()
    return res.data

@router.get("/{log_id}", response_model=Log)
def get_log(log_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incident_logs").select("*").eq("id", log_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found or does not belong to the specified organization")
    return res.data[0]

@router.patch("/{log_id}", response_model=Log)
async def update_log(log_id: str, payload: LogUpdate, org_id: str = Query(...), supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("incident_logs").update(update_data).eq("id", log_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Get the incident to find the title
    incident_res = supabase.table("incidents").select("title").eq("id", res.data[0]["incident_id"]).execute()
    if incident_res.data:
        # Get organization name
        org_res = supabase.table("orgs").select("name").eq("id", org_id).execute()
        org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
        
        await send_log_update_notifications(
            res.data[0],
            incident_res.data[0]['title'],
            org_id,
            org_name,
            supabase
        )
    
    return res.data[0]

@router.delete("/{log_id}")
async def delete_log(log_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incident_logs").delete().eq("id", log_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    
    # Get the incident to find the title
    incident_res = supabase.table("incidents").select("title").eq("id", res.data[0]["incident_id"]).execute()
    if incident_res.data:
        # Get organization name
        org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
        org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
        
        await send_log_delete_notifications(
            res.data[0],
            incident_res.data[0]['title'],
            res.data[0]["org_id"],
            org_name,
            supabase
        )
    
    return {"message": "Log deleted successfully"} 