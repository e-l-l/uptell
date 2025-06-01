from fastapi import Request, HTTPException
from supabase_client import get_user_supabase_client, get_admin_client

def get_supabase(request: Request):
    """
    Dependency to get authenticated Supabase client from request.
    Handles token extraction and validation with proper error messages.
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(
            status_code=401, 
            detail="Missing authorization header. Please sign in."
        )
    
    if not auth_header.startswith("bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Invalid authorization header format. Please sign in again."
        )
    
    token = auth_header.replace("bearer ", "").strip()
    
    if not token:
        raise HTTPException(
            status_code=401, 
            detail="Empty authentication token. Please sign in again."
        )
    
    # The get_user_supabase_client function will handle token validation
    # and raise appropriate HTTPExceptions for auth errors
    return get_user_supabase_client(token)

def get_public_supabase():
    """
    Dependency to get admin Supabase client for public endpoints.
    Uses service role key for admin access without authentication.
    """
    return get_admin_client() 