from fastapi import APIRouter, Depends, HTTPException, Path, Query
from typing import List

from routes.schemas.maintainance import Maintenance, MaintenanceCreate, MaintenanceUpdate
from ..dependencies import get_supabase
from websocket_manager import manager
    
router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

from fastapi.encoders import jsonable_encoder

@router.post("", response_model=Maintenance)
async def create_maintenance(payload: MaintenanceCreate, supabase=Depends(get_supabase)):
    # Convert the payload to a JSON-serializable format
    serialized_payload = jsonable_encoder(payload)
    
    # Insert the serialized payload into the Supabase table
    res = supabase.table("maintenance").insert(serialized_payload).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create maintenance")
    
    user = supabase.auth.get_user().user
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**res.data[0])
    
    # Broadcast the new maintenance event
    await manager.broadcast(
        {
            "type": "new_maintenance",
            "data": maintenance.model_dump(),
            "user_id": user.id
        },
        org_id=payload.org_id
    )
    
    return maintenance

@router.get("", response_model=List[Maintenance])
def list_all_maintenance(org_id: str = Query(...), supabase=Depends(get_supabase)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    res = supabase.table("maintenance").select("*").eq("org_id", org_id).execute()
    if not res.data:
        return []
    return res.data

@router.get("/app/{app_id}", response_model=List[Maintenance])
def list_app_maintenance(app_id: str = Path(...), supabase=Depends(get_supabase)):
    if not app_id:
        raise HTTPException(status_code=400, detail="Application ID is required")
    
    res = supabase.table("maintenance").select("*").eq("app_id", app_id).execute()
    if not res.data:
        return []
    return res.data

@router.patch("/{id}", response_model=Maintenance)
async def update_maintenance(id: str, payload: MaintenanceUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("maintenance").update(update_data).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    user=supabase.auth.get_user().user
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**res.data[0])
    await manager.broadcast({"type": "updated_maintenance", "data": maintenance.model_dump(), "user_id": user.id}, org_id=res.data[0]["org_id"])
    return maintenance

@router.delete("/{id}")
async def delete_maintenance(id: str, supabase=Depends(get_supabase)):
    res = supabase.table("maintenance").delete().eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    user=supabase.auth.get_user().user
    await manager.broadcast({"type": "deleted_maintenance", "data": {"id": id}, "user_id": user.id}, org_id=res.data[0]["org_id"])
    return {"message": "Maintenance deleted successfully"} 