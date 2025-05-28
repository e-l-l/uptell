from fastapi import Request, HTTPException
from supabase_client import get_user_supabase_client

def get_supabase(request: Request):
    print("request", request.headers)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = auth_header.replace("bearer ", "")
    return get_user_supabase_client(token) 