from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None

class Organization(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    name: str
    org_id: int

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    org_id: Optional[int] = None

class Team(TeamBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationBase(BaseModel):
    name: str
    type: str
    org_id: int

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    org_id: Optional[int] = None

class Application(ApplicationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentBase(BaseModel):
    title: str
    status: str
    application_id: int

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    application_id: Optional[int] = None

class Incident(IncidentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LogBase(BaseModel):
    status: str
    message: str
    time: str

class LogCreate(LogBase):
    pass

class LogUpdate(BaseModel):
    status: Optional[str] = None
    message: Optional[str] = None
    time: Optional[str] = None

class Log(LogBase):
    id: int
    incident_id: int
    created_at: datetime

    class Config:
        from_attributes = True 