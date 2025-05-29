from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

class IncidentBase(BaseModel):
    org_id: str
    app_id: str
    status: Literal["Reported", "Investigating", "Identified", "Fixed"]
    description: str

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    org_id: Optional[str] = None
    app_id: Optional[str] = None
    status: Optional[Literal["Reported", "Investigating", "Identified", "Fixed"]] = None
    description: Optional[str] = None

class Incident(IncidentBase):
    id: str
    time: datetime

    class Config:
        from_attributes = True 