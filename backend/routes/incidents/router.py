from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..schemas import Incident, IncidentCreate, IncidentUpdate
from ..dependencies import get_supabase
from . import logs

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Include logs subrouter
router.include_router(logs.router, prefix="/{incident_id}")

@router.post("", response_model=Incident)
def create_incident(payload: IncidentCreate, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").insert(payload.dict()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create incident")
    return res.data[0]

@router.get("", response_model=List[Incident])
def list_incidents(application_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").select("*").eq("application_id", application_id).execute()
    return res.data

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").select("*").eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return res.data[0]

@router.patch("/{incident_id}", response_model=Incident)
def update_incident(incident_id: int, payload: IncidentUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("incidents").update(update_data).eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return res.data[0]

@router.delete("/{incident_id}")
def delete_incident(incident_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").delete().eq("id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"message": "Incident deleted successfully"} 