from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging
from ..schemas import Organization, OrganizationCreate, OrganizationUpdate
from ..dependencies import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("", response_model=Organization)
def create_organization(payload: OrganizationCreate, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("orgs").insert(payload.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create organization - no data returned")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create organization")

@router.get("", response_model=List[Organization])
def list_organizations(supabase=Depends(get_supabase)):
    try:
        res = supabase.table("orgs").select("*").execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list organizations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organizations")

@router.get("/{org_id}", response_model=Organization)
def get_organization(org_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("orgs").select("*").eq("id", org_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organization")

@router.patch("/{org_id}", response_model=Organization)
def update_organization(org_id: str, payload: OrganizationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    try:
        res = supabase.table("orgs").update(update_data).eq("id", org_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update organization")

@router.delete("/{org_id}")
def delete_organization(org_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("orgs").delete().eq("id", org_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Organization with ID {org_id} not found")
        return {"message": f"Organization {org_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete organization") 