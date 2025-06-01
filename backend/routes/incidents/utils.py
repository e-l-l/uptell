from fastapi import BackgroundTasks
from utils.notification_service import send_org_notification
from websocket_manager import manager

async def send_incident_create_notifications(
    incident_data: dict,
    org_id: str,
    org_name: str,
    application_name: str,
    supabase: any
):
    """
    Send notifications for incident creation
    
    Args:
        incident_data: The created incident data
        org_id: Organization ID
        org_name: Organization name
        application_name: Name of the application
        supabase: Supabase client instance
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification
    await manager.broadcast({
        "type": "new_incident", 
        "data": incident_data, 
        "user_id": user.id
    }, org_id=org_id)
    
    send_org_notification(
        org_id=org_id,
        action="created",
        entity_type="Incident",
        entity_name=incident_data["title"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        status=incident_data["status"],
        application_name=application_name,
    )

async def send_incident_update_notifications(
    incident_data: dict,
    org_name: str,
    application_name: str,
    supabase: any
):
    """
    Send notifications for incident update
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    await manager.broadcast({
        "type": "updated_incident", 
        "data": incident_data, 
        "user_id": user.id
    }, org_id=incident_data["org_id"])
    
    send_org_notification(
        org_id=incident_data["org_id"],
        action="updated",
        entity_type="Incident",
        entity_name=incident_data["title"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Status: {incident_data['status']}",
        exclude_user_id=user.id,
        status=incident_data["status"],
        application_name=application_name,
    )
    
async def send_incident_delete_notifications(
    incident_data: dict,
    org_name: str,
    application_name: str,
    supabase: any
):
    """
    Send notifications for incident deletion
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification
    await manager.broadcast({
        "type": "deleted_incident", 
        "data": {"id": incident_data["id"]}, 
        "user_id": user.id
    }, org_id=incident_data["org_id"])
    
    send_org_notification(
        org_id=incident_data["org_id"],
        action="deleted",
        entity_type="Incident",
        entity_name=incident_data["title"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        status=incident_data["status"],
        application_name=application_name,
    )

async def send_log_create_notifications(
    log_data: dict,
    incident_title: str,
    org_id: str,
    org_name: str,
    supabase: any
):
    """
    Send notifications for incident log creation
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    await manager.broadcast({
        "type": "new_log", 
        "data": log_data, 
        "user_id": user.id
    }, org_id=org_id)
    
    send_org_notification(
        org_id=org_id,
        action="created",
        entity_type="Log",
        entity_name=f"Status update for {incident_title}",
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Update: {log_data['message']}",
        exclude_user_id=user.id,
        incident_name=incident_title,
        log_status=log_data['status']
    )

async def send_log_update_notifications(
    log_data: dict,
    incident_title: str,
    org_id: str,
    org_name: str,
    supabase: any
):
    """
    Send notifications for incident log update
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    await manager.broadcast({
        "type": "updated_log", 
        "data": log_data, 
        "user_id": user.id
    }, org_id=org_id)
    
    send_org_notification(
        org_id=org_id,
        action="updated",
        entity_type="Log",
        entity_name=f"Status update for {incident_title}",
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Update: {log_data['message']}",
        exclude_user_id=user.id,
        incident_name=incident_title,
        log_status=log_data['status']
    )

async def send_log_delete_notifications(
    log_data: dict,
    incident_title: str,
    org_id: str,
    org_name: str,
    supabase: any
):
    """
    Send notifications for incident log deletion
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    await manager.broadcast({
        "type": "deleted_log", 
        "data": {"id": log_data["id"]}, 
        "user_id": user.id
    }, org_id=org_id)
    
    send_org_notification(
        org_id=org_id,
        action="deleted",
        entity_type="Log",
        entity_name=f"Status update for {incident_title}",
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        incident_name=incident_title,
        log_status=log_data.get('status', '')
    ) 