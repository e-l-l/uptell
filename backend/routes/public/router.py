from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
import logging
from datetime import datetime, timezone
from ..schemas import Application
from ..dependencies import get_public_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/public", tags=["Public"])

@router.get("/organizations", response_model=List[Dict[str, Any]])
def list_public_organizations(supabase=Depends(get_public_supabase)):
    """Get list of all organizations with basic info for the dropdown"""
    try:
        res = supabase.table("orgs").select("id, name").execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list public organizations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organizations")

@router.get("/stats/{org_id}/services", response_model=List[Application])
def get_org_services_status(org_id: str, supabase=Depends(get_public_supabase)):
    """Get current status of all services for an organization"""
    try:
        # Verify organization exists
        try:
            org_res = supabase.table("orgs").select("id").eq("id", org_id).execute()
            if not org_res.data:
                raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to verify organization {org_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to verify organization")
        
        # Get all applications for the organization
        try:
            res = supabase.table("apps").select("*").eq("org_id", org_id).execute()
            return res.data or []
        except Exception as e:
            logger.error(f"Failed to get services for organization {org_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve services")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting services for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organization services")

@router.get("/stats/{org_id}/incidents/summary")
def get_org_incidents_summary(org_id: str, supabase=Depends(get_public_supabase)):
    """Get summary of active incidents and next/current maintenance"""
    try:
        # Verify organization exists
        try:
            org_res = supabase.table("orgs").select("id").eq("id", org_id).execute()
            if not org_res.data:
                raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to verify organization {org_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to verify organization")
        
        # Get active incidents (not fixed)
        try:
            incidents_res = supabase.table("incidents").select("*").eq("org_id", org_id).neq("status", "Fixed").execute()
            active_incidents = incidents_res.data or []
        except Exception as e:
            logger.error(f"Failed to get active incidents for organization {org_id}: {str(e)}")
            active_incidents = []
        
        # Get current and upcoming maintenance
        try:
            now = datetime.now(timezone.utc).isoformat()
            maintenance_res = supabase.table("maintenance").select("*").eq("org_id", org_id).gte("end_time", now).execute()
            upcoming_maintenance = maintenance_res.data or []
        except Exception as e:
            logger.error(f"Failed to get maintenance for organization {org_id}: {str(e)}")
            upcoming_maintenance = []
        
        # Find current maintenance (started but not ended)
        current_maintenance = []
        next_maintenance = []
        
        try:
            for maintenance in upcoming_maintenance:
                try:
                    start_time = datetime.fromisoformat(maintenance["start_time"].replace("Z", "+00:00"))
                    end_time = datetime.fromisoformat(maintenance["end_time"].replace("Z", "+00:00"))
                    now_dt = datetime.now(timezone.utc)
                    
                    if start_time <= now_dt <= end_time:
                        current_maintenance.append(maintenance)
                    elif start_time > now_dt:
                        next_maintenance.append(maintenance)
                except (ValueError, KeyError) as e:
                    logger.warning(f"Invalid maintenance datetime format: {str(e)}")
                    continue
            
            # Sort next maintenance by start time
            next_maintenance.sort(key=lambda x: x.get("start_time", ""))
        except Exception as e:
            logger.error(f"Failed to process maintenance times: {str(e)}")
            # Continue with empty lists
        
        return {
            "active_incidents_count": len(active_incidents),
            "active_incidents": active_incidents,
            "current_maintenance_count": len(current_maintenance),
            "current_maintenance": current_maintenance,
            "next_maintenance": next_maintenance[0] if next_maintenance else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting incidents summary for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents summary")

@router.get("/stats/{org_id}/incidents/timeline")
def get_org_incidents_timeline(
    org_id: str, 
    limit: int = Query(default=50, le=100),
    supabase=Depends(get_public_supabase)
):
    """Get timeline of recent incident logs for an organization"""
    try:
        # Verify organization exists
        try:
            org_res = supabase.table("orgs").select("id").eq("id", org_id).execute()
            if not org_res.data:
                raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to verify organization {org_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to verify organization")
        
        # Get recent incident logs with incident and app details
        try:
            logs_res = supabase.table("incident_logs") \
                .select("""
                    *,
                    incident:incidents(*, application:apps(*))
                """) \
                .eq("org_id", org_id) \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            
            return logs_res.data or []
        except Exception as e:
            logger.error(f"Failed to get incident timeline for organization {org_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve incident timeline")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting incidents timeline for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents timeline")

@router.get("/stats/{org_id}/overview")
def get_org_stats_overview(org_id: str, supabase=Depends(get_public_supabase)):
    """Get complete overview for an organization's public stats page"""
    try:
        # Verify organization exists
        try:
            org_res = supabase.table("orgs").select("id, name").eq("id", org_id).execute()
            if not org_res.data:
                raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
            organization = org_res.data[0]
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get organization {org_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve organization")
        
        # Get services status
        try:
            services_res = supabase.table("apps").select("*").eq("org_id", org_id).execute()
            services = services_res.data or []
        except Exception as e:
            logger.error(f"Failed to get services for organization {org_id}: {str(e)}")
            services = []
        
        # Get incidents summary
        try:
            incidents_res = supabase.table("incidents").select("*").eq("org_id", org_id).neq("status", "Fixed").execute()
            active_incidents = incidents_res.data or []
        except Exception as e:
            logger.error(f"Failed to get active incidents for organization {org_id}: {str(e)}")
            active_incidents = []
        
        # Get maintenance info
        try:
            now = datetime.now(timezone.utc).isoformat()
            maintenance_res = supabase.table("maintenance").select("*").eq("org_id", org_id).gte("end_time", now).execute()
            upcoming_maintenance = maintenance_res.data or []
        except Exception as e:
            logger.error(f"Failed to get maintenance for organization {org_id}: {str(e)}")
            upcoming_maintenance = []
        
        # Process maintenance
        current_maintenance = []
        next_maintenance = []
        
        try:
            for maintenance in upcoming_maintenance:
                try:
                    start_time = datetime.fromisoformat(maintenance["start_time"].replace("Z", "+00:00"))
                    end_time = datetime.fromisoformat(maintenance["end_time"].replace("Z", "+00:00"))
                    now_dt = datetime.now(timezone.utc)
                    
                    if start_time <= now_dt <= end_time:
                        current_maintenance.append(maintenance)
                    elif start_time > now_dt:
                        next_maintenance.append(maintenance)
                except (ValueError, KeyError) as e:
                    logger.warning(f"Invalid maintenance datetime format: {str(e)}")
                    continue
            
            next_maintenance.sort(key=lambda x: x.get("start_time", ""))
        except Exception as e:
            logger.error(f"Failed to process maintenance times: {str(e)}")
            # Continue with empty lists
        
        # Get recent incident timeline
        try:
            logs_res = supabase.table("incident_logs") \
                .select("""
                    *,
                    incident:incidents(*, application:apps(*))
                """) \
                .eq("org_id", org_id) \
                .order("created_at", desc=True) \
                .limit(20) \
                .execute()
            
            recent_logs = logs_res.data or []
        except Exception as e:
            logger.error(f"Failed to get incident timeline for organization {org_id}: {str(e)}")
            recent_logs = []
        
        return {
            "organization": organization,
            "services": services,
            "incidents_summary": {
                "active_incidents_count": len(active_incidents),
                "active_incidents": active_incidents,
                "current_maintenance_count": len(current_maintenance),
                "current_maintenance": current_maintenance,
                "next_maintenance": next_maintenance[0] if next_maintenance else None
            },
            "recent_timeline": recent_logs
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting overview for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organization overview")

@router.get("/app/{app_name}/status")
def get_app_status_by_name(app_name: str, supabase=Depends(get_public_supabase)):
    """Get status of an application by its name"""
    try:
        # Search for apps with the given name
        try:
            res = supabase.table("apps").select("*, org:orgs(id, name)").eq("name", app_name).execute()
            
            if not res.data:
                raise HTTPException(status_code=404, detail=f"Application with name '{app_name}' not found")
            
            apps = res.data
            
            # If multiple apps with same name exist, return all of them with organization info
            if len(apps) > 1:
                return {
                    "message": f"Multiple applications found with name '{app_name}'",
                    "count": len(apps),
                    "applications": apps
                }
            else:
                return apps[0]
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get app status for '{app_name}': {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve application status")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting app status for '{app_name}': {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve application status") 