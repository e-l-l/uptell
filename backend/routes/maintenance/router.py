from fastapi import APIRouter, Depends, HTTPException, Path, Query
from typing import List
import logging

from routes.schemas.maintainance import Maintenance, MaintenanceCreate, MaintenanceUpdate
from ..dependencies import get_supabase
from .utils import (
    send_maintenance_create_notifications,
    send_maintenance_update_notifications,
    send_maintenance_delete_notifications
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

from fastapi.encoders import jsonable_encoder

@router.post("", response_model=Maintenance)
async def create_maintenance(payload: MaintenanceCreate, supabase=Depends(get_supabase)):
    try:
        # Convert the payload to a JSON-serializable format
        try:
            serialized_payload = jsonable_encoder(payload)
        except Exception as e:
            logger.error(f"Failed to serialize maintenance payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid maintenance data format")
        
        try:
            res = supabase.table("maintenance").insert(serialized_payload).execute()
            if not res.data:
                raise HTTPException(status_code=400, detail="Failed to create maintenance - no data returned")
            maintenance_data = res.data[0]
        except Exception as e:
            logger.error(f"Failed to insert maintenance into database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create maintenance")
        
        # Get organization name
        try:
            org_res = supabase.table("orgs").select("name").eq("id", payload.org_id).execute()
            if not org_res.data:
                logger.warning(f"Organization with ID {payload.org_id} not found")
                org_name = "Unknown Organization"
            else:
                org_name = org_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch organization name: {str(e)}")
            org_name = "Unknown Organization"
        
        # Send notifications
        try:
            await send_maintenance_create_notifications(
                maintenance_data, 
                payload.org_id, 
                org_name, 
                supabase
            )
        except Exception as e:
            logger.error(f"Failed to send maintenance creation notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        # Create Maintenance model instance to ensure proper datetime serialization
        try:
            maintenance = Maintenance(**maintenance_data)
            return maintenance
        except Exception as e:
            logger.error(f"Failed to create Maintenance model instance: {str(e)}")
            return maintenance_data
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating maintenance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create maintenance")

@router.get("", response_model=List[Maintenance])
def list_all_maintenance(org_id: str = Query(...), supabase=Depends(get_supabase)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    try:
        res = supabase.table("maintenance").select("*").eq("org_id", org_id).execute()
        if not res.data:
            return []
        
        # Create Maintenance model instances to ensure proper datetime serialization
        try:
            return [Maintenance(**item) for item in res.data]
        except Exception as e:
            logger.error(f"Failed to create Maintenance model instances: {str(e)}")
            return res.data
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list maintenance for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve maintenance")

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