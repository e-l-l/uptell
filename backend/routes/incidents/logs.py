from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List
from ..schemas import Log, LogCreate, LogUpdate
from ..dependencies import get_supabase

router = APIRouter(prefix="/logs", tags=["Incident Logs"])

@router.post("", response_model=Log)
def create_log(incident_id: str, payload: LogCreate, supabase=Depends(get_supabase)):
    data = payload.model_dump()
    data["incident_id"] = incident_id  # Set incident_id from path parameter
    res = supabase.table("incident_logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create log")
    return res.data[0]

@router.get("", response_model=List[Log])
def list_logs(incident_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incident_logs").select("*").eq("incident_id", incident_id).execute()
    return res.data

@router.get("/{log_id}", response_model=Log)
def get_log(log_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incident_logs").select("*").eq("id", log_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return res.data[0]

@router.patch("/{log_id}", response_model=Log)
def update_log(log_id: str, payload: LogUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("incident_logs").update(update_data).eq("id", log_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return res.data[0]

@router.delete("/{log_id}")
def delete_log(log_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("incident_logs").delete().eq("id", log_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted successfully"} 