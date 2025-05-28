from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import datetime
from uuid import UUID

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None

class Organization(OrganizationBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    name: str
    org_id: UUID

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    org_id: Optional[UUID] = None

class Team(TeamBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationBase(BaseModel):
    name: str
    org_id: UUID
    status: str

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    name: Optional[str] = None
    org_id: Optional[UUID] = None
    status: Optional[str] = None

class Application(ApplicationBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentBase(BaseModel):
    org_id: UUID
    app_id: UUID
    status: Literal["Reported", "Investigating", "Identified", "Fixed"]
    description: str

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    org_id: Optional[UUID] = None
    app_id: Optional[UUID] = None
    status: Optional[Literal["Reported", "Investigating", "Identified", "Fixed"]] = None
    description: Optional[str] = None

class Incident(IncidentBase):
    id: UUID
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
    id: UUID
    incident_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class UserOrganizationBase(BaseModel):
    user_id: UUID
    org_id: UUID
    role: Literal["owner", "member"]

class UserOrganizationCreate(UserOrganizationBase):
    pass

class UserOrganizationUpdate(BaseModel):
    role: Optional[Literal["owner", "member"]] = None

class UserOrganization(UserOrganizationBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class OrganizationInviteBase(BaseModel):
    org_id: UUID
    email: str
    role: Literal["owner", "member"]
    code: str

class OrganizationInviteCreate(OrganizationInviteBase):
    pass

class OrganizationInvite(OrganizationInviteBase):
    id: UUID
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True