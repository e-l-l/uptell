from fastapi import BackgroundTasks
from utils.notification_service import send_org_notification
from websocket_manager import manager

async def send_app_create_notifications(
    app_data: dict,
    org_id: str,
    org_name: str,
    supabase: any
):
    """
    Send notifications for application creation
    
    Args:
        app_data: The created application data
        org_id: Organization ID
        org_name: Organization name
        user: User data from supabase auth
    """
    
    user=supabase.auth.get_user().user
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification in background
    await manager.broadcast({
            "type": "new_app", 
            "data": app_data, 
            "user_id": user.id
        }, org_id=org_id)
    
    send_org_notification(
        org_id=org_id,
        action="created",
        entity_type="Application",
        entity_name=app_data["name"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        status=app_data["status"]
    )

async def send_app_update_notifications(
    app_data: dict,
    org_name: str,
    supabase: any,
):
    """
    Send notifications for application update
    """
    user=supabase.auth.get_user().user
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    send_org_notification(
        org_id=app_data["org_id"],
        action="updated",
        entity_type="Application",
        entity_name=app_data["name"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Status changed to {app_data['status']}" if 'status' in app_data else "",
        exclude_user_id=user.id,
        status=app_data["status"]
    )
    await manager.broadcast({"type": "updated_app", "data": app_data, "user_id": user.id}, org_id=app_data["org_id"])
    
    
async def send_app_delete_notifications(
    app_data: dict,
    org_name: str,
    supabase: any
):
    """
    Send notifications for application deletion
    """
    user=supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification in background
    await manager.broadcast({"type": "deleted_app", "data": {"id": app_data["id"]}, "user_id": user.id}, org_id=app_data["org_id"])
    
    send_org_notification(
        org_id=app_data["org_id"],
        action="deleted",
        entity_type="Application",
        entity_name=app_data["name"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        status=app_data["status"]
    )