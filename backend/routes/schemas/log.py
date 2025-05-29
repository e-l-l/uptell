from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LogBase(BaseModel):
    status: str
    message: str

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