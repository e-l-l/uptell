from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..schemas import (
    UserOrganization,
    UserOrganizationCreate,
    UserOrganizationUpdate,
    OrganizationInvite,
    OrganizationInviteCreate,
)
from ..dependencies import get_supabase
import uuid
from datetime import datetime, timedelta

router = APIRouter(prefix="/user-organizations", tags=["User Organizations"])

@router.post("", response_model=UserOrganization)
def create_user_organization(payload: UserOrganizationCreate, supabase=Depends(get_supabase)):
    # Check if user already belongs to the organization
    existing = supabase.table("user_organizations").select("*").eq("user_id", payload.user_id).eq("org_id", payload.org_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="User already belongs to this organization")
    
    res = supabase.table("user_organizations").insert(payload.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create user organization")
    return res.data[0]

@router.get("/user/{user_id}", response_model=List[UserOrganization])
def list_user_organizations(user_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("user_organizations").select("*").eq("user_id", user_id).execute()
    return res.data

@router.get("/org/{org_id}", response_model=List[UserOrganization])
def list_organization_users(org_id: str, supabase=Depends(get_supabase)):
    res = supabase.table("user_organizations").select("*").eq("org_id", org_id).execute()
    return res.data

@router.patch("/{id}", response_model=UserOrganization)
def update_user_organization(id: str, payload: UserOrganizationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    res = supabase.table("user_organizations").update(update_data).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User organization not found")
    return res.data[0]

@router.delete("/{id}")
def delete_user_organization(id: str, supabase=Depends(get_supabase)):
    res = supabase.table("user_organizations").delete().eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User organization not found")
    return {"message": "User organization deleted successfully"}

# Organization Invites
@router.post("/invites", response_model=OrganizationInvite)
def create_organization_invite(payload: OrganizationInviteCreate, supabase=Depends(get_supabase)):
    # Generate a unique invite code
    invite_code = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)  # Invite expires in 7 days
    
    invite_data = {
        **payload.model_dump(),
        "code": invite_code,
        "expires_at": expires_at.isoformat()
    }
    
    res = supabase.table("organization_invites").insert(invite_data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create organization invite")
    return res.data[0]

@router.get("/invites/{code}", response_model=OrganizationInvite)
def get_organization_invite(code: str, supabase=Depends(get_supabase)):
    res = supabase.table("organization_invites").select("*").eq("code", code).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    invite = res.data[0]
    if datetime.fromisoformat(invite["expires_at"]) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    return invite

@router.post("/join/{code}", response_model=UserOrganization)
def join_organization(code: str, user_id: str, supabase=Depends(get_supabase)):
    # Get the invite
    invite_res = supabase.table("organization_invites").select("*").eq("code", code).execute()
    if not invite_res.data:
        raise HTTPException(status_code=404, detail="Invite not found")
    
    invite = invite_res.data[0]
    if datetime.fromisoformat(invite["expires_at"]) < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invite has expired")
    
    # Create user organization relationship
    user_org = UserOrganizationCreate(
        user_id=user_id,
        org_id=invite["org_id"],
        role=invite["role"]
    )
    
    res = supabase.table("user_organizations").insert(user_org.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to join organization")
    
    # Delete the used invite
    supabase.table("organization_invites").delete().eq("code", code).execute()
    
    return res.data[0] 