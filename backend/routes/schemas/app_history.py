from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class AppHistoryBase(BaseModel):
    app_id: str
    status: str

class AppHistoryCreate(AppHistoryBase):
    pass

class AppHistoryUpdate(BaseModel):
    status: Optional[str] = None

class AppHistory(AppHistoryBase):
    id: str
    recorded_at: datetime
    
    class Config:
        from_attributes = True 