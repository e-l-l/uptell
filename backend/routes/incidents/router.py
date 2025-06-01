from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import logging
from ..schemas import Incident, IncidentCreate, IncidentUpdate, PaginatedIncidentResponse, PaginationMeta
import math
from ..dependencies import get_supabase
from . import logs
from .utils import (
    send_incident_create_notifications,
    send_incident_update_notifications,
    send_incident_delete_notifications
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Include logs subrouter
router.include_router(logs.router, prefix="/{incident_id}")

@router.post("", response_model=Incident)
async def create_incident(payload: IncidentCreate, supabase=Depends(get_supabase)):
    try:
        # Create the incident
        res = supabase.table("incidents").insert(payload.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create incident - no data returned")
        
        incident_data = res.data[0]
        
        # Create initial incident log
        try:
            log_data = {
                "incident_id": incident_data["id"],
                "org_id": payload.org_id,
                "status": incident_data["status"],
                "message": incident_data["description"]
            }
            log_res = supabase.table("incident_logs").insert(log_data).execute()
            if not log_res.data:
                logger.warning(f"Failed to create initial log for incident {incident_data['id']}")
        except Exception as e:
            logger.error(f"Failed to create initial incident log: {str(e)}")
            # Don't fail the entire operation for log creation failure
        
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
        
        # Get application name
        try:
            app_res = supabase.table("apps").select("name").eq("id", payload.app_id).execute()
            if not app_res.data:
                logger.warning(f"Application with ID {payload.app_id} not found")
                application_name = "Unknown Application"
            else:
                application_name = app_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch application name: {str(e)}")
            application_name = "Unknown Application"
        
        # Send notifications
        try:
            await send_incident_create_notifications(
                incident_data, 
                payload.org_id, 
                org_name, 
                application_name, 
                supabase
            )
        except Exception as e:
            logger.error(f"Failed to send incident creation notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        return incident_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating incident: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create incident")

@router.get("", response_model=PaginatedIncidentResponse)
def list_incidents(
    org_id: str = Query(..., description="Organization ID"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page (max 100)"),
    app_id: Optional[str] = Query(None, description="Filter by application ID"),
    supabase=Depends(get_supabase)
):
    if not org_id:
        raise HTTPException(status_code=400, detail="Organization ID is required")
    
    try:
        # Calculate offset for pagination
        offset = (page - 1) * limit
        
        # Build base query with org_id filter
        query = supabase.table("incidents").select("*", count="exact").eq("org_id", org_id)
        
        # Add app_id filter if provided
        if app_id:
            query = query.eq("app_id", app_id)
        
        # Order by time (newest first) and apply pagination
        query = query.order("time", desc=True).range(offset, offset + limit - 1)
        
        res = query.execute()
        
        # Get total count for pagination metadata
        total_count = res.count if res.count is not None else 0
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
        
        return PaginatedIncidentResponse(
            data=res.data or [],
            pagination=PaginationMeta(
                total=total_count,
                page=page,
                limit=limit,
                total_pages=total_pages
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list incidents for org {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents")

@router.get("/{incident_id}", response_model=Incident)
def get_incident(incident_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("incidents").select("*").eq("id", incident_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get incident {incident_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incident")

@router.patch("/{incident_id}", response_model=Incident)
async def update_incident(incident_id: str, payload: IncidentUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    try:
        # Update the incident
        res = supabase.table("incidents").update(update_data).eq("id", incident_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found")
        
        incident_data = res.data[0]
        
        # Get organization name
        try:
            org_res = supabase.table("orgs").select("name").eq("id", incident_data["org_id"]).execute()
            if not org_res.data:
                logger.warning(f"Organization with ID {incident_data['org_id']} not found")
                org_name = "Unknown Organization"
            else:
                org_name = org_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch organization name: {str(e)}")
            org_name = "Unknown Organization"
        
        # Get application name
        try:
            app_res = supabase.table("apps").select("name").eq("id", incident_data["app_id"]).execute()
            if not app_res.data:
                logger.warning(f"Application with ID {incident_data['app_id']} not found")
                application_name = "Unknown Application"
            else:
                application_name = app_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch application name: {str(e)}")
            application_name = "Unknown Application"
        
        # Send notifications
        try:
            await send_incident_update_notifications(
                incident_data, 
                org_name, 
                application_name, 
                supabase
            )
        except Exception as e:
            logger.error(f"Failed to send incident update notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        return incident_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating incident {incident_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update incident")

@router.delete("/{incident_id}")
async def delete_incident(incident_id: str, supabase=Depends(get_supabase)):
    try:
        # First, get the incident data before deletion for notifications
        get_res = supabase.table("incidents").select("*").eq("id", incident_id).execute()
        if not get_res.data:
            raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found")
        
        incident_data = get_res.data[0]
        
        # Delete the incident
        res = supabase.table("incidents").delete().eq("id", incident_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Incident with ID {incident_id} not found or already deleted")
        
        # Get organization name
        try:
            org_res = supabase.table("orgs").select("name").eq("id", incident_data["org_id"]).execute()
            if not org_res.data:
                logger.warning(f"Organization with ID {incident_data['org_id']} not found")
                org_name = "Unknown Organization"
            else:
                org_name = org_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch organization name: {str(e)}")
            org_name = "Unknown Organization"
        
        # Get application name
        try:
            app_res = supabase.table("apps").select("name").eq("id", incident_data["app_id"]).execute()
            if not app_res.data:
                logger.warning(f"Application with ID {incident_data['app_id']} not found")
                application_name = "Unknown Application"
            else:
                application_name = app_res.data[0]["name"]
        except Exception as e:
            logger.error(f"Failed to fetch application name: {str(e)}")
            application_name = "Unknown Application"
        
        # Send notifications
        try:
            await send_incident_delete_notifications(
                incident_data, 
                org_name, 
                application_name, 
                supabase
            )
        except Exception as e:
            logger.error(f"Failed to send incident deletion notifications: {str(e)}")
            # Don't fail the entire operation for notifications
        
        return {"message": f"Incident {incident_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting incident {incident_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete incident") 