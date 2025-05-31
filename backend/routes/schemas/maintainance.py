from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class MaintenanceBase(BaseModel):
    app_id: str
    org_id: str
    title: str
    start_time: datetime
    end_time: datetime

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class Maintenance(MaintenanceBase):
    id: str
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            datetime: lambda v: v.isoformat()
        }
    ) 