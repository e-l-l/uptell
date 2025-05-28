from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from ..schemas import Application, ApplicationCreate, ApplicationUpdate
from ..dependencies import get_supabase

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("", response_model=Application)
def create_application(payload: ApplicationCreate, supabase=Depends(get_supabase)):
    res = supabase.table("applications").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create application")
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
def update_application(app_id: int, payload: ApplicationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("apps").update(update_data).eq("id", app_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return res.data[0]

@router.delete("/{app_id}")
def delete_application(app_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("apps").delete().eq("id", app_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted successfully"} 