from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None

class Organization(OrganizationBase):
    id: str

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
    organization: Optional[Organization] = None
    class Config:
        from_attributes = True

class OrganizationInviteBase(BaseModel):
    org_id: str
    email: str
    role: Literal["owner", "member"]
    expires_at: Optional[datetime] = None

class OrganizationInviteCreate(OrganizationInviteBase):
    pass

class OrganizationInvite(OrganizationInviteBase):
    id: str
    code: str
    organization: Optional[Organization] = None
    invited_by: str
    created_at: datetime

    class Config:
        from_attributes = True 