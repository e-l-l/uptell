from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from gotrue.errors import (
    AuthWeakPasswordError,
    AuthInvalidCredentialsError,
)

from supabase_client import get_admin_client


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

@router.post("/signup", response_model=AuthResponse)
def signup(auth: SignUpRequest):
    try:
        client = get_admin_client()
        res = client.auth.sign_up({
            "email": auth.email, 
            "password": auth.password,
            "options": {
                "data": {
                    "first_name": auth.firstName,
                    "last_name": auth.lastName
                }
            }
        })
        
        # Extract the session data
        session = res.session
        if not session:
            raise HTTPException(status_code=500, detail="No session created during signup")
            
        return AuthResponse(
            access_token=session.access_token,
            token_type="bearer",
            user=res.user.model_dump()
        )
    except Exception as e:
        handle_auth_error(e)

@router.post("/signin", response_model=AuthResponse)
def signin(auth: SignInRequest):
    try:
        client = get_admin_client()
        res = client.auth.sign_in_with_password({
            "email": auth.email, 
            "password": auth.password
        })
        
        # Extract the session data
        session = res.session
        if not session:
            raise HTTPException(status_code=500, detail="No session created during signin")
            
        return AuthResponse(
            access_token=session.access_token,
            token_type="bearer",
            user=res.user.model_dump()
        )
    except Exception as e:
        handle_auth_error(e)

@router.post("/signout")
def signout():
    try:
        client = get_admin_client()
        res = client.auth.sign_out()
        return {"message": "Successfully signed out"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during signout: {str(e)}"
        ) 