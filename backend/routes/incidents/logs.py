from fastapi import APIRouter, Depends, HTTPException, Query, Path
from typing import List
import logging
from ..schemas import Log, LogCreate, LogUpdate
from ..dependencies import get_supabase
from .utils import (
    send_log_create_notifications,
    send_log_update_notifications,
    send_log_delete_notifications
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/logs", tags=["Incident Logs"])

@router.post("", response_model=Log)
async def create_log(incident_id: str, payload: LogCreate, supabase=Depends(get_supabase)):
    try:
        data = payload.model_dump()
        data["incident_id"] = incident_id  # Set incident_id from path parameter
        
        try:
            res = supabase.table("incident_logs").insert(data).execute()
            if not res.data:
                raise HTTPException(status_code=400, detail="Failed to create log - no data returned")
            log_data = res.data[0]
        except Exception as e:
            logger.error(f"Failed to insert incident log into database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to create incident log")
        
        # Get the incident to find the org_id and title
        try:
            incident_res = supabase.table("incidents").select("title").eq("id", incident_id).execute()
            if not incident_res.data:
                raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found")
            incident_title = incident_res.data[0]['title']
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch incident {incident_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve incident information")
        
        # Get organization name
        try:
            org_res = supabase.table("orgs").select("name").eq("id", log_data["org_id"]).execute()
            if not org_res.data:
                logger.warning(f"Organization with ID {log_data['org_id']} not found")
                org_name = "Unknown Organization"
            else:
                org_name = org_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch organization name: {str(e)}")
            org_name = "Unknown Organization"
        
        # Send notifications
        try:
            await send_log_create_notifications(
                log_data,
                incident_title,
                log_data["org_id"],
                org_name,
                supabase
            )
        except Exception as e:
            logger.error(f"Failed to send log creation notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        return log_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating incident log: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create incident log")

@router.get("", response_model=List[Log])
def list_logs(incident_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("incident_logs").select("*").eq("incident_id", incident_id).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list logs for incident {incident_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incident logs")

@router.get("/org/{org_id}", response_model=List[Log])
def list_logs_by_org(org_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("incident_logs").select("*").eq("org_id", org_id).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list logs for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organization logs")

@router.get("/{log_id}", response_model=Log)
def get_log(log_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("incident_logs").select("*").eq("id", log_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Log with ID {log_id} not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get log {log_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve log")

@router.patch("/{log_id}", response_model=Log)
async def update_log(log_id: str, payload: LogUpdate, org_id: str = Query(...), supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    try:
        # Update the log
        try:
            res = supabase.table("incident_logs").update(update_data).eq("id", log_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail=f"Log with ID {log_id} not found")
            log_data = res.data[0]
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to update log {log_id} in database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to update log")
        
        # Get the incident to find the title
        try:
            incident_res = supabase.table("incidents").select("title").eq("id", log_data["incident_id"]).execute()
            if incident_res.data:
                incident_title = incident_res.data[0]['title']
                
                # Get organization name
                try:
                    org_res = supabase.table("orgs").select("name").eq("id", org_id).execute()
                    if not org_res.data:
                        logger.warning(f"Organization with ID {org_id} not found")
                        org_name = "Unknown Organization"
                    else:
                        org_name = org_res.data[0]["name"]
                except Exception as e:
                    logger.error(f"Failed to fetch organization name: {str(e)}")
                    org_name = "Unknown Organization"
                
                # Send notifications
                try:
                    await send_log_update_notifications(
                        log_data,
                        incident_title,
                        org_id,
                        org_name,
                        supabase
                    )
                except Exception as e:
                    logger.error(f"Failed to send log update notifications: {str(e)}")
                    # Don't fail the entire operation for notifications
        except Exception as e:
            logger.error(f"Failed to process incident information for log update: {str(e)}")
            # Continue without notifications
        
        return log_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating log {log_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update log")

@router.delete("/{log_id}")
async def delete_log(log_id: str, supabase=Depends(get_supabase)):
    try:
        # First, get the log data before deletion for notifications
        try:
            get_res = supabase.table("incident_logs").select("*").eq("id", log_id).execute()
            if not get_res.data:
                raise HTTPException(status_code=404, detail=f"Log with ID {log_id} not found")
            log_data = get_res.data[0]
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get log {log_id} before deletion: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve log for deletion")
        
        # Delete the log
        try:
            res = supabase.table("incident_logs").delete().eq("id", log_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail=f"Log with ID {log_id} not found or already deleted")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to delete log {log_id} from database: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete log")
        
        # Get the incident to find the title
        try:
            incident_res = supabase.table("incidents").select("title").eq("id", log_data["incident_id"]).execute()
            if incident_res.data:
                incident_title = incident_res.data[0]['title']
                
                # Get organization name
                try:
                    org_res = supabase.table("orgs").select("name").eq("id", log_data["org_id"]).execute()
                    if not org_res.data:
                        logger.warning(f"Organization with ID {log_data['org_id']} not found")
                        org_name = "Unknown Organization"
                    else:
                        org_name = org_res.data[0]["name"]
                except Exception as e:
                    logger.error(f"Failed to fetch organization name: {str(e)}")
                    org_name = "Unknown Organization"
                
                # Send notifications
                try:
                    await send_log_delete_notifications(
                        log_data,
                        incident_title,
                        log_data["org_id"],
                        org_name,
                        supabase
                    )
                except Exception as e:
                    logger.error(f"Failed to send log deletion notifications: {str(e)}")
                    # Don't fail the entire operation for notifications
        except Exception as e:
            logger.error(f"Failed to process incident information for log deletion: {str(e)}")
            # Continue without notifications
        
        return {"message": f"Log {log_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting log {log_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete log") 