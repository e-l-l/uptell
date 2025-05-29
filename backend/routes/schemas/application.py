from pydantic import BaseModel
from typing import Optional

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