import os
from dotenv import load_dotenv
from supabase import create_client, Client
from gotrue.errors import AuthApiError, AuthInvalidJwtError
from fastapi import HTTPException

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # For admin ops
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def get_user_supabase_client(access_token: str) -> Client:
    """
    Create a Supabase client with user authentication.
    Raises HTTPException with proper status codes for auth errors.
    """
    try:
        client = create_client(SUPABASE_URL, ANON_KEY)
        client.auth.set_session(access_token, access_token)
        return client
    except AuthApiError as e:
        # Handle specific auth API errors
        error_msg = str(e)
        if "Invalid Refresh Token" in error_msg or "Refresh Token Not Found" in error_msg:
            raise HTTPException(
                status_code=401, 
                detail="Your session has expired. Please sign in again."
            )
        elif "Invalid JWT" in error_msg or "JWT" in error_msg:
            raise HTTPException(
                status_code=401, 
                detail="Invalid authentication token. Please sign in again."
            )
        else:
            raise HTTPException(
                status_code=401, 
                detail="Authentication failed. Please sign in again."
            )
    except AuthInvalidJwtError as e:
        raise HTTPException(
            status_code=401, 
            detail="Invalid authentication token. Please sign in again."
        )
    except Exception as e:
        # Log the actual error for debugging while sending generic message to client
        print(f"Unexpected auth error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Authentication service unavailable. Please try again later."
        )

def get_admin_client() -> Client:
    """
    Create a Supabase client with service role (admin) permissions.
    """
    try:
        return create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    except Exception as e:
        print(f"Failed to create admin client: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail="Service temporarily unavailable. Please try again later."
        )