from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..schemas import Organization, OrganizationCreate, OrganizationUpdate
from ..dependencies import get_supabase

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.post("", response_model=Organization)
def create_organization(payload: OrganizationCreate, supabase=Depends(get_supabase)):
    res = supabase.table("orgs").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create organization")
    return res.data[0]

@router.get("", response_model=List[Organization])
def list_organizations(supabase=Depends(get_supabase)):
    res = supabase.table("orgs").select("*").execute()
    return res.data

@router.get("/{org_id}", response_model=Organization)
def get_organization(org_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("orgs").select("*").eq("id", org_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return res.data[0]

@router.patch("/{org_id}", response_model=Organization)
def update_organization(org_id: str, payload: OrganizationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("orgs").update(update_data).eq("id", org_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return res.data[0]

@router.delete("/{org_id}")
def delete_organization(org_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("orgs").delete().eq("id", org_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {"message": "Organization deleted successfully"} 