from typing import Union

from fastapi import FastAPI
from routes import auth_routes
from backend.routes.orgs import router as org_router
from routes.apps import router as app_router
from routes.incidents import router as incident_router

app = FastAPI()

# Auth routes
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])

# CRUD routes
app.include_router(org_router)
app.include_router(app_router)
app.include_router(incident_router)

