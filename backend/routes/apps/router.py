from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
import logging
from routes.apps.utils import send_app_create_notifications, send_app_delete_notifications, send_app_update_notifications
from routes.apps import history
from ..schemas import Application, ApplicationCreate, ApplicationUpdate
from ..dependencies import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["Applications"])
router.include_router(history.router, prefix="/{app_id}")

@router.post("", response_model=Application)
async def create_application(payload: ApplicationCreate, supabase=Depends(get_supabase)):
    try:
        # Create the application
        res = supabase.table("apps").insert(payload.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create application - no data returned")
        
        app_data = res.data[0]
        
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

        # Create app status history entry
        try:
            supabase.table("app_status_history").insert({
                "app_id": app_data["id"],
                "status": app_data["status"],
            }).execute()
        except Exception as e:
            logger.error(f"Failed to create app status history entry: {str(e)}")
            # Don't fail the entire operation for history logging
        
        # Send notifications
        try:
            await send_app_create_notifications(app_data, payload.org_id, org_name, supabase)
        except Exception as e:
            logger.error(f"Failed to send app creation notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        return app_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating application: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: Failed to create application")

@router.get("", response_model=List[Application])
def list_applications(org_id: str = Query(...), supabase=Depends(get_supabase)):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    try:
        res = supabase.table("apps").select("*").eq("org_id", org_id).execute()
        if not res.data:
            return []
        return res.data
    except Exception as e:
        logger.error(f"Failed to list applications for org {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve applications")

@router.get("/{app_id}", response_model=Application)
def get_application(app_id: int, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("apps").select("*").eq("id", app_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Application with ID {app_id} not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get application {app_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve application")

@router.patch("/{app_id}", response_model=Application)
async def update_application(app_id: str, payload: ApplicationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    try:
        # Update the application
        res = supabase.table("apps").update(update_data).eq("id", app_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Application with ID {app_id} not found")
        
        app_data = res.data[0]
        
        # Get organization name
        try:
            org_res = supabase.table("orgs").select("name").eq("id", app_data["org_id"]).execute()
            if not org_res.data:
                logger.warning(f"Organization with ID {app_data['org_id']} not found")
                org_name = "Unknown Organization"
            else:
                org_name = org_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch organization name: {str(e)}")
            org_name = "Unknown Organization"

        # Create app status history entry if status was updated
        if "status" in update_data:
            try:
                supabase.table("app_status_history").insert({
                    "app_id": app_data["id"],
                    "status": app_data["status"],
                }).execute()
            except Exception as e:
                logger.error(f"Failed to create app status history entry: {str(e)}")
                # Don't fail the entire operation for history logging

        # Send notifications
        try:
            await send_app_update_notifications(app_data, org_name, supabase)
        except Exception as e:
            logger.error(f"Failed to send app update notifications: {str(e)}")
            # Don't fail the entire operation for notifications

        return app_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating application {app_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update application")

@router.delete("/{app_id}")
async def delete_application(app_id: str, supabase=Depends(get_supabase)):
    try:
        # First, get the app data before deletion for notifications
        get_res = supabase.table("apps").select("*").eq("id", app_id).execute()
        if not get_res.data:
            raise HTTPException(status_code=404, detail=f"Application with ID {app_id} not found")
        
        app_data = get_res.data[0]
        
        # Delete the application
        res = supabase.table("apps").delete().eq("id", app_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Application with ID {app_id} not found or already deleted")
        
        # Get organization name
        try:
            org_res = supabase.table("orgs").select("name").eq("id", app_data["org_id"]).execute()
            if not org_res.data:
                logger.warning(f"Organization with ID {app_data['org_id']} not found")
                org_name = "Unknown Organization"
            else:
                org_name = org_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch organization name: {str(e)}")
            org_name = "Unknown Organization"

        # Send notifications
        try:
            await send_app_delete_notifications(app_data, org_name, supabase)
        except Exception as e:
            logger.error(f"Failed to send app deletion notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        return {"message": f"Application {app_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting application {app_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete application") 