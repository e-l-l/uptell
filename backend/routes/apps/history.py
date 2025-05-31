from fastapi import APIRouter, Depends, Query, Path
from typing import List

from routes.schemas.app_history import AppHistory
from ..dependencies import get_supabase
from datetime import datetime
router = APIRouter(prefix="/history", tags=["Application History"])

@router.get("", response_model=List[AppHistory])
def get_log(
    app_id: str = Path(...),
    start_time: datetime = Query(None, description="Start time for filtering logs"),
    end_time: datetime = Query(None, description="End time for filtering logs"),
    supabase=Depends(get_supabase)
):
    query = supabase.table("app_status_history").select("*").eq("app_id", app_id)
    
    if start_time:
        query = query.gte("recorded_at", start_time.isoformat())
    if end_time:
        query = query.lte("recorded_at", end_time.isoformat())
        
    res = query.order("recorded_at", desc=True).execute()
    return res.data