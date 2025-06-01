from pydantic import BaseModel
from typing import Literal, Optional, List, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')

class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMeta

class IncidentBase(BaseModel):
    org_id: str
    app_id: str
    status: Literal["Reported", "Investigating", "Identified", "Fixed"]
    title: str
    description: str

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    org_id: Optional[str] = None
    app_id: Optional[str] = None
    status: Optional[Literal["Reported", "Investigating", "Identified", "Fixed"]] = None
    title: Optional[str] = None
    description: Optional[str] = None

class Incident(IncidentBase):
    id: str
    time: datetime

    class Config:
        from_attributes = True

class PaginatedIncidentResponse(PaginatedResponse[Incident]):
    pass 