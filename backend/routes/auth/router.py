from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from gotrue.errors import (
    AuthWeakPasswordError,
    AuthInvalidCredentialsError,
)

from supabase_client import get_admin_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])

class SignUpRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    org: dict

def handle_auth_error(error):
    """Handle common Supabase auth errors and return appropriate HTTP exceptions"""
    if isinstance(error, AuthWeakPasswordError):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        )
    elif isinstance(error, AuthInvalidCredentialsError):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    else:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

@router.post("/signup")
async def signup(request: SignUpRequest):
    try:
        # Create user in Supabase Auth
        admin = get_admin_client()
        try:
            user = admin.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "first_name": request.firstName,
                        "last_name": request.lastName
                    }
                }
            })
            
            if not user.user:
                raise HTTPException(status_code=400, detail="Failed to create user - no user data returned")
                
        except AuthWeakPasswordError:
            raise HTTPException(status_code=400, detail="Password is too weak")
        except Exception as e:
            logger.error(f"Failed to create user in Supabase Auth: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")

        # Create default organization using user's first name
        try:
            org_name = f"{request.firstName}'s Organization"
            org = admin.table("orgs").insert({
                "name": org_name
            }).execute()

            if not org.data:
                raise HTTPException(status_code=400, detail="Failed to create organization - no data returned")
            
            org_data = org.data[0]
            
        except Exception as e:
            logger.error(f"Failed to create organization for user {user.user.id}: {str(e)}")
            # Try to clean up the user if organization creation fails
            try:
                admin.auth.admin.delete_user(user.user.id)
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup user after org creation failure: {str(cleanup_error)}")
            raise HTTPException(status_code=500, detail="Failed to create organization")

        # Add user to organization as owner
        try:
            user_org = admin.table("user_orgs").insert({
                "user_id": user.user.id,
                "org_id": org_data["id"],
                "role": "owner"
            }).execute()

            if not user_org.data:
                raise HTTPException(status_code=400, detail="Failed to add user to organization - no data returned")
                
        except Exception as e:
            logger.error(f"Failed to add user {user.user.id} to organization {org_data['id']}: {str(e)}")
            # Try to clean up user and org if user_org creation fails
            try:
                admin.table("orgs").delete().eq("id", org_data["id"]).execute()
                admin.auth.admin.delete_user(user.user.id)
            except Exception as cleanup_error:
                logger.error(f"Failed to cleanup after user_org creation failure: {str(cleanup_error)}")
            raise HTTPException(status_code=500, detail="Failed to add user to organization")

        return {"message": "User created successfully", "user": user.user}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during signup")

@router.post("/signin", response_model=AuthResponse)
def signin(auth: SignInRequest):
    try:
        client = get_admin_client()
        
        try:
            res = client.auth.sign_in_with_password({
                "email": auth.email, 
                "password": auth.password
            })
        except AuthInvalidCredentialsError:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        except Exception as e:
            logger.error(f"Auth signin failed for {auth.email}: {str(e)}")
            raise HTTPException(status_code=500, detail="Authentication Error: " + str(e))
        
        # Extract the session data
        session = res.session
        if not session:
            raise HTTPException(status_code=500, detail="No session created during signin")
        
        if not res.user:
            raise HTTPException(status_code=500, detail="No user data returned during signin")
            
        # Get user organization
        try:
            user_orgs_res = client.table("user_orgs").select("orgs(*)").eq("user_id", res.user.id).execute()
            if not user_orgs_res.data:
                logger.warning(f"No organization found for user {res.user.id}")
                raise HTTPException(status_code=404, detail="No organization found for user")
            
            org_data = user_orgs_res.data[0]["orgs"]
            if not org_data:
                raise HTTPException(status_code=404, detail="Organization data not found")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch organization for user {res.user.id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to retrieve user organization")
            
        return AuthResponse(
            access_token=session.access_token,
            token_type="bearer",
            user=res.user.model_dump(),
            org=org_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during signin: {str(e)}")
        handle_auth_error(e)

@router.post("/signout")
def signout():
    try:
        client = get_admin_client()
        res = client.auth.sign_out()
        return {"message": "Successfully signed out"}
    except Exception as e:
        logger.error(f"Error during signout: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during signout: {str(e)}"
        ) 