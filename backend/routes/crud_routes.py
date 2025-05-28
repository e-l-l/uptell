from fastapi import APIRouter, Request, Depends, HTTPException
from supabase_client import get_user_supabase_client
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# ---------- SCHEMAS ----------
class Organization(BaseModel):
    name: str

class Team(BaseModel):
    name: str
    org_id: int

class Application(BaseModel):
    name: str
    type: str
    org_id: int

class Incident(BaseModel):
    title: str
    status: str
    application_id: int

class Log(BaseModel):
    incident_id: int
    status: str
    message: str
    time: str

# ---------- HELPERS ----------
def get_supabase(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = auth_header.replace("Bearer ", "")
    return get_user_supabase_client(token)

# ---------- CRUD ENDPOINTS ----------
@router.post("/organizations")
def create_org(payload: Organization, supabase=Depends(get_supabase)):
    res = supabase.table("organizations").insert(payload.dict()).execute()
    return res.data

@router.post("/teams")
def create_team(payload: Team, supabase=Depends(get_supabase)):
    res = supabase.table("teams").insert(payload.dict()).execute()
    return res.data

@router.post("/applications")
def create_app(payload: Application, supabase=Depends(get_supabase)):
    res = supabase.table("applications").insert(payload.dict()).execute()
    return res.data

@router.get("/applications")
def list_apps(org_id: int, supabase=Depends(get_supabase)):
    res = supabase.table("applications").select("*").eq("org_id", org_id).execute()
    return res.data

@router.post("/incidents")
def create_incident(payload: Incident, supabase=Depends(get_supabase)):
    res = supabase.table("incidents").insert(payload.dict()).execute()
    return res.data

@router.post("/incidents/{incident_id}/logs")
def add_log(incident_id: int, payload: Log, supabase=Depends(get_supabase)):
    data = payload.dict()
    data["incident_id"] = incident_id
    res = supabase.table("logs").insert(data).execute()
    return res.data 