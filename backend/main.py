from typing import Union

from fastapi import FastAPI
from routes.auth.router import router as auth_router
from routes.orgs.router import router as org_router
from routes.apps.router import router as app_router
from routes.incidents.router import router as incident_router

app = FastAPI()

# Include all routers
app.include_router(auth_router)
app.include_router(org_router)
app.include_router(app_router)
app.include_router(incident_router)

