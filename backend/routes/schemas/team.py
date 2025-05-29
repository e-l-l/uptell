from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    org_id: str

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    org_id: Optional[str] = None

class Team(TeamBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True 