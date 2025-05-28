from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from supabase_client import get_admin_client

router = APIRouter()

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(auth: AuthRequest):
    client = get_admin_client()
    res = client.auth.sign_up({"email": auth.email, "password": auth.password})
    if res.get("error"):
        raise HTTPException(status_code=400, detail=res["error"]["message"])
    return res

@router.post("/signin")
def signin(auth: AuthRequest):
    client = get_admin_client()
    res = client.auth.sign_in_with_password({"email": auth.email, "password": auth.password})
    if res.get("error"):
        raise HTTPException(status_code=400, detail=res["error"]["message"])
    return res

@router.post("/signout")
def signout():
    # Clients should discard the token
    return {"message": "Signout client-side by removing token"} 