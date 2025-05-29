from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None

class Organization(OrganizationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

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

class ApplicationBase(BaseModel):
    name: str
    org_id: str
    status: str

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    org_id: Optional[str] = None
    status: Optional[str] = None

class Application(ApplicationBase):
    id: str
    class Config:
        from_attributes = True

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

class LogBase(BaseModel):
    status: str
    message: str
    time: str

class LogCreate(LogBase):
    pass
class LogUpdate(BaseModel):
    status: Optional[str] = None
    message: Optional[str] = None

class Log(LogBase):
    id: str
    incident_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserOrganizationBase(BaseModel):
    user_id: str
    org_id: str
    role: Literal["owner", "member"]

class UserOrganizationCreate(UserOrganizationBase):
    pass

class UserOrganizationUpdate(BaseModel):
    role: Optional[Literal["owner", "member"]] = None

class UserOrganization(UserOrganizationBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationInviteBase(BaseModel):
    org_id: str
    email: str
    role: Literal["owner", "member"]
    code: str

class OrganizationInviteCreate(OrganizationInviteBase):
    pass

class OrganizationInvite(OrganizationInviteBase):
    id: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True