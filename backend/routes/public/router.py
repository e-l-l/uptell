from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from datetime import datetime, timezone
from ..schemas import Application
from ..dependencies import get_public_supabase

router = APIRouter(prefix="/public", tags=["Public"])

@router.get("/organizations", response_model=List[Dict[str, Any]])
def list_public_organizations(supabase=Depends(get_public_supabase)):
    """Get list of all organizations with basic info for the dropdown"""
    res = supabase.table("orgs").select("id, name").execute()
    return res.data

@router.get("/stats/{org_id}/services", response_model=List[Application])
def get_org_services_status(org_id: str, supabase=Depends(get_public_supabase)):
    """Get current status of all services for an organization"""
    # Verify organization exists
    org_res = supabase.table("orgs").select("id").eq("id", org_id).execute()
    if not org_res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get all applications for the organization
    res = supabase.table("apps").select("*").eq("org_id", org_id).execute()
    return res.data

@router.get("/stats/{org_id}/incidents/summary")
def get_org_incidents_summary(org_id: str, supabase=Depends(get_public_supabase)):
    """Get summary of active incidents and next/current maintenance"""
    # Verify organization exists
    org_res = supabase.table("orgs").select("id").eq("id", org_id).execute()
    if not org_res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get active incidents (not fixed)
    incidents_res = supabase.table("incidents").select("*").eq("org_id", org_id).neq("status", "Fixed").execute()
    active_incidents = incidents_res.data or []
    
    # Get current and upcoming maintenance
    now = datetime.now(timezone.utc).isoformat()
    maintenance_res = supabase.table("maintenance").select("*").eq("org_id", org_id).gte("end_time", now).execute()
    upcoming_maintenance = maintenance_res.data or []
    
    # Find current maintenance (started but not ended)
    current_maintenance = []
    next_maintenance = []
    
    for maintenance in upcoming_maintenance:
        start_time = datetime.fromisoformat(maintenance["start_time"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(maintenance["end_time"].replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        
        if start_time <= now_dt <= end_time:
            current_maintenance.append(maintenance)
        elif start_time > now_dt:
            next_maintenance.append(maintenance)
    
    # Sort next maintenance by start time
    next_maintenance.sort(key=lambda x: x["start_time"])
    
    return {
        "active_incidents_count": len(active_incidents),
        "active_incidents": active_incidents,
        "current_maintenance_count": len(current_maintenance),
        "current_maintenance": current_maintenance,
        "next_maintenance": next_maintenance[0] if next_maintenance else None
    }

@router.get("/stats/{org_id}/incidents/timeline")
def get_org_incidents_timeline(
    org_id: str, 
    limit: int = Query(default=50, le=100),
    supabase=Depends(get_public_supabase)
):
    """Get timeline of recent incident logs for an organization"""
    # Verify organization exists
    org_res = supabase.table("orgs").select("id").eq("id", org_id).execute()
    if not org_res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Get recent incident logs with incident and app details
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

@router.get("/stats/{org_id}/overview")
def get_org_stats_overview(org_id: str, supabase=Depends(get_public_supabase)):
    """Get complete overview for an organization's public stats page"""
    # Verify organization exists
    org_res = supabase.table("orgs").select("id, name").eq("id", org_id).execute()
    if not org_res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    organization = org_res.data[0]
    
    # Get services status
    services_res = supabase.table("apps").select("*").eq("org_id", org_id).execute()
    services = services_res.data or []
    
    # Get incidents summary
    incidents_res = supabase.table("incidents").select("*").eq("org_id", org_id).neq("status", "Fixed").execute()
    active_incidents = incidents_res.data or []
    
    # Get maintenance info
    now = datetime.now(timezone.utc).isoformat()
    maintenance_res = supabase.table("maintenance").select("*").eq("org_id", org_id).gte("end_time", now).execute()
    upcoming_maintenance = maintenance_res.data or []
    
    # Process maintenance
    current_maintenance = []
    next_maintenance = []
    
    for maintenance in upcoming_maintenance:
        start_time = datetime.fromisoformat(maintenance["start_time"].replace("Z", "+00:00"))
        end_time = datetime.fromisoformat(maintenance["end_time"].replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        
        if start_time <= now_dt <= end_time:
            current_maintenance.append(maintenance)
        elif start_time > now_dt:
            next_maintenance.append(maintenance)
    
    next_maintenance.sort(key=lambda x: x["start_time"])
    
    # Get recent incident timeline
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