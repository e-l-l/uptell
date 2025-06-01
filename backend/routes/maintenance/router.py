from fastapi import APIRouter, Depends, HTTPException, Path, Query
from typing import List

from routes.schemas.maintainance import Maintenance, MaintenanceCreate, MaintenanceUpdate
from ..dependencies import get_supabase
from .utils import (
    send_maintenance_create_notifications,
    send_maintenance_update_notifications,
    send_maintenance_delete_notifications
)

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

from fastapi.encoders import jsonable_encoder

@router.post("", response_model=Maintenance)
async def create_maintenance(payload: MaintenanceCreate, supabase=Depends(get_supabase)):
    # Convert the payload to a JSON-serializable format
    serialized_payload = jsonable_encoder(payload)
    
    res = supabase.table("maintenance").insert(serialized_payload).execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create maintenance")
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", payload.org_id).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    await send_maintenance_create_notifications(
        res.data[0], 
        payload.org_id, 
        org_name, 
        supabase
    )
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**res.data[0])
    
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
    # Convert the payload to a JSON-serializable format
    serialized_payload = jsonable_encoder(payload)
    print("SERIAL PAYMLOAD",serialized_payload)
    # Filter out None values
    update_data = {k: v for k, v in serialized_payload.items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("maintenance").update(update_data).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    await send_maintenance_update_notifications(
        res.data[0], 
        org_name, 
        supabase
    )
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**res.data[0])
    
    return maintenance

@router.delete("/{id}")
async def delete_maintenance(id: str, supabase=Depends(get_supabase)):
    res = supabase.table("maintenance").delete().eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    
    # Get organization name
    org_res = supabase.table("orgs").select("name").eq("id", res.data[0]["org_id"]).execute()
    org_name = org_res.data[0]["name"] if org_res.data else "Unknown Organization"
    
    await send_maintenance_delete_notifications(
        res.data[0], 
        org_name, 
        supabase
    )
    
    return {"message": "Maintenance deleted successfully"} 