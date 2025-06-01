from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging
from ..schemas import (
    UserOrganization,
    UserOrganizationCreate,
    UserOrganizationUpdate,
    OrganizationInvite,
    OrganizationInviteCreate,
)
from ..dependencies import get_supabase
import uuid
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user-organizations", tags=["User Organizations"])

@router.post("", response_model=UserOrganization)
def create_user_organization(payload: UserOrganizationCreate, supabase=Depends(get_supabase)):
    try:
        # Check if user already belongs to the organization
        existing = supabase.table("user_orgs").select("*").eq("user_id", payload.user_id).eq("org_id", payload.org_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="User already belongs to this organization")
        
        res = supabase.table("user_orgs").insert(payload.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create user organization - no data returned")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating user organization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create user organization")

@router.get("/user/{user_id}", response_model=List[UserOrganization])
def list_user_organizations(user_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("user_orgs").select("*").eq("user_id", user_id).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list organizations for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user organizations")

@router.get("/orgs/{org_id}")
def list_organization_users(org_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.rpc("get_users_for_org", {"org_id": org_id}).execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Failed to list users for organization {org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organization users")

@router.patch("/{user_id}/{org_id}", response_model=UserOrganization)
def update_user_organization(user_id: str, org_id: str, payload: UserOrganizationUpdate, supabase=Depends(get_supabase)):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    try:
        res = supabase.table("user_orgs").update(update_data).eq("user_id", user_id).eq("org_id", org_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"User organization relationship not found for user {user_id} and org {org_id}")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error updating user organization {user_id}/{org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update user organization")

@router.delete("/{user_id}/{org_id}")
def delete_user_organization(user_id: str, org_id: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("user_orgs").delete().eq("user_id", user_id).eq("org_id", org_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"User organization relationship not found for user {user_id} and org {org_id}")
        return {"message": f"User {user_id} removed from organization {org_id} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting user organization {user_id}/{org_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete user organization")

# Organization Invites
@router.post("/invites", response_model=OrganizationInvite)
def create_organization_invite(payload: OrganizationInviteCreate, supabase=Depends(get_supabase)):
    try:
        # Generate a unique invite code
        invite_code = str(uuid.uuid4())
        expires_at = payload.expires_at or datetime.utcnow() + timedelta(days=7)  # Invite expires in 7 days
        
        # Get current user
        try:
            user = supabase.auth.get_user().user
            if not user:
                raise HTTPException(status_code=401, detail="User not authenticated")
        except Exception as e:
            logger.error(f"Failed to get current user for invite creation: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        invite_data = {
            **payload.model_dump(),
            "code": invite_code,
            "expires_at": expires_at.isoformat(),
            "invited_by": user.id
        }
        
        res = supabase.table("org_invites").insert(invite_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create organization invite - no data returned")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating organization invite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create organization invite")

@router.get("/invites/{code}", response_model=OrganizationInvite)
def get_organization_invite(code: str, supabase=Depends(get_supabase)):
    try:
        res = supabase.table("org_invites").select("*").eq("code", code).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail=f"Invite with code {code} not found")
        
        invite = res.data[0]
        
        # Check if invite has expired
        try:
            invite_expires = datetime.fromisoformat(invite["expires_at"]).replace(tzinfo=timezone.utc)
            current_time = datetime.now(timezone.utc)
            
            if invite_expires < current_time:
                raise HTTPException(status_code=400, detail="Invite has expired")
        except ValueError as e:
            logger.error(f"Invalid date format in invite {code}: {str(e)}")
            raise HTTPException(status_code=500, detail="Invalid invite data")
        
        # Get organization details
        try:
            org_res = supabase.table("orgs").select("*").eq("id", invite["org_id"]).execute()
            if not org_res.data:
                raise HTTPException(status_code=404, detail="Organization not found for this invite")
            
            # Add organization info to the response
            invite["organization"] = org_res.data[0]
        except Exception as e:
            logger.error(f"Failed to fetch organization for invite {code}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve organization details")
        
        return invite
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error getting organization invite {code}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve organization invite")

@router.post("/join/{code}", response_model=UserOrganization)
def join_organization(code: str, supabase=Depends(get_supabase)):
    try:
        # Get the invite
        invite_res = supabase.table("org_invites").select("*").eq("code", code).execute()
        if not invite_res.data:
            raise HTTPException(status_code=404, detail=f"Invite with code {code} not found")
        
        invite = invite_res.data[0]
        
        # Check if invite has expired
        try:
            invite_expires = datetime.fromisoformat(invite["expires_at"]).replace(tzinfo=timezone.utc)
            current_time = datetime.now(timezone.utc)
            
            if invite_expires < current_time:
                raise HTTPException(status_code=400, detail="Invite has expired")
        except ValueError as e:
            logger.error(f"Invalid date format in invite {code}: {str(e)}")
            raise HTTPException(status_code=500, detail="Invalid invite data")
        
        # Get current user
        try:
            user = supabase.auth.get_user().user
            if not user:
                raise HTTPException(status_code=401, detail="User not authenticated")
        except Exception as e:
            logger.error(f"Failed to get current user for joining organization: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Check if user is already in the organization
        try:
            existing_res = supabase.table("user_orgs").select("*").eq("user_id", user.id).eq("org_id", invite["org_id"]).execute()
            if existing_res.data:
                raise HTTPException(status_code=400, detail="User is already a member of this organization")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to check existing membership: {str(e)}")
            # Continue with the process as this check is not critical
        
        # Create user organization relationship
        user_org = UserOrganizationCreate(
            user_id=user.id,
            org_id=invite["org_id"],
            role=invite["role"]
        )
        
        try:
            res = supabase.table("user_orgs").insert(user_org.model_dump()).execute()
            if not res.data:
                raise HTTPException(status_code=400, detail="Failed to join organization - could not create membership")
        except Exception as e:
            logger.error(f"Failed to create user organization relationship: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to join organization")
        
        # Delete the used invite
        try:
            supabase.table("org_invites").delete().eq("code", code).execute()
        except Exception as e:
            logger.error(f"Failed to delete used invite {code}: {str(e)}")
            # Don't fail the operation if invite deletion fails
        
        # Get organization details including the key
        try:
            org_res = supabase.table("orgs").select("*").eq("id", invite["org_id"]).execute()
            if org_res.data:
                # Add organization key to the response
                response_data = res.data[0]
                response_data["organization"] = org_res.data[0]
                return response_data
            else:
                logger.warning(f"Organization {invite['org_id']} not found after join")
                return res.data[0]
        except Exception as e:
            logger.error(f"Failed to fetch organization details after join: {str(e)}")
            return res.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error joining organization with code {code}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to join organization")