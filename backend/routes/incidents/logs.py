from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..schemas import Log, LogCreate, LogUpdate
from ..dependencies import get_supabase

router = APIRouter(prefix="/logs", tags=["Incident Logs"])

@router.post("", response_model=Log)
def create_log(incident_id: int, payload: LogCreate, supabase=Depends(get_supabase)):
    data = payload.dict()
    data["incident_id"] = incident_id
    res = supabase.table("logs").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create log")
    return res.data[0]

@router.get("", response_model=List[Log])
def list_logs(incident_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("logs").select("*").eq("incident_id", incident_id).execute()
    return res.data

@router.get("/{log_id}", response_model=Log)
def get_log(incident_id: int, log_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("logs").select("*").eq("id", log_id).eq("incident_id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return res.data[0]

@router.patch("/{log_id}", response_model=Log)
def update_log(incident_id: int, log_id: int, payload: LogUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("logs").update(update_data).eq("id", log_id).eq("incident_id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return res.data[0]

@router.delete("/{log_id}")
def delete_log(incident_id: int, log_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("logs").delete().eq("id", log_id).eq("incident_id", incident_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Log not found")
    return {"message": "Log deleted successfully"} 