from typing import Union
import logging
import os
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from websocket_manager import manager
from routes.auth.router import router as auth_router
from routes.orgs.router import router as org_router
from routes.apps.router import router as app_router
from routes.incidents.router import router as incident_router
from routes.user_orgs.router import router as user_org_router
from routes.maintenance.router import router as maintenance_router
from routes.public.router import router as public_router
from fastapi.middleware.cors import CORSMiddleware
from gotrue.errors import AuthApiError, AuthInvalidJwtError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent format"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.method} {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(AuthApiError)
async def auth_api_error_handler(request: Request, exc: AuthApiError):
    """Handle Supabase Auth API errors that might not be caught elsewhere"""
    logger.error(f"Auth API Error: {str(exc)} - {request.method} {request.url}")
    error_msg = str(exc)
    
    if "Invalid Refresh Token" in error_msg or "Refresh Token Not Found" in error_msg:
        detail = "Your session has expired. Please sign in again."
    elif "Invalid JWT" in error_msg or "JWT" in error_msg:
        detail = "Invalid authentication token. Please sign in again."
    else:
        detail = "Authentication failed. Please sign in again."
    
    return JSONResponse(
        status_code=401,
        content={"detail": detail}
    )

@app.exception_handler(AuthInvalidJwtError)
async def auth_invalid_token_handler(request: Request, exc: AuthInvalidJwtError):
    """Handle invalid token errors"""
    logger.error(f"Invalid Token Error: {str(exc)} - {request.method} {request.url}")
    return JSONResponse(
        status_code=401,
        content={"detail": "Invalid authentication token. Please sign in again."}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {str(exc)} - {request.method} {request.url}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."}
    )

# Configure CORS based on environment
environment = os.getenv("ENVIRONMENT", "development")
if environment == "production":
    allowed_origins = [
        os.getenv("FRONTEND_URL", "https://localhost:3000/")
    ]
    # Remove duplicates while preserving order
    allowed_origins = list(dict.fromkeys(allowed_origins))
else:
    # Allow all origins in development
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(org_router)
app.include_router(app_router)
app.include_router(incident_router)
app.include_router(user_org_router)
app.include_router(maintenance_router)
app.include_router(public_router)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    org_id = None
    try:
        # Get org_id from query params
        query_params = dict(websocket.query_params)
        org_id = query_params.get("org_id")
        
        if not org_id:
            logger.error("WebSocket connection attempted without org_id")
            await websocket.close(code=1008, reason="Missing org_id parameter")
            return
        
        logger.info(f"WebSocket connection request for org_id: {org_id}")
        
        # Connect to the manager
        await manager.connect(websocket, org_id)
        logger.info(f"WebSocket connected successfully for org_id: {org_id}")

        # Keep the connection alive
        try:
            while True:
                # Wait for any message (we don't actually process client messages)
                await websocket.receive_text()
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected normally for org_id: {org_id}")
        except Exception as e:
            logger.error(f"WebSocket error during message handling for org_id {org_id}: {str(e)}")
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected during setup for org_id: {org_id}")
    except Exception as e:
        logger.error(f"WebSocket connection error for org_id {org_id}: {str(e)}")
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass  # Connection might already be closed
    finally:
        # Ensure cleanup happens
        if org_id:
            manager.disconnect(websocket)