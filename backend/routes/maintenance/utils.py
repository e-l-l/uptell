from utils.notification_service import send_org_notification
from websocket_manager import manager
from routes.schemas.maintainance import Maintenance
from fastapi.encoders import jsonable_encoder

async def send_maintenance_create_notifications(
    maintenance_data: dict,
    org_id: str,
    org_name: str,
    supabase: any
):
    """
    Send notifications for maintenance creation
    
    Args:
        maintenance_data: The created maintenance data
        org_id: Organization ID
        org_name: Organization name
        supabase: Supabase client instance
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**maintenance_data)
    serialized_maintenance = jsonable_encoder(maintenance)
    
    # Run websocket broadcast and email notification
    await manager.broadcast({
        "type": "new_maintenance",
        "data": serialized_maintenance,
        "user_id": user.id
    }, org_id=org_id)
    
    send_org_notification(
        org_id=org_id,
        action="created",
        entity_type="Maintenance",
        entity_name=maintenance_data["title"],
        user_name=user_name,
        org_name=org_name,
        additional_details=f"Scheduled from {serialized_maintenance['start_time']} to {serialized_maintenance['end_time']}",
        exclude_user_id=user.id,
        start_time=serialized_maintenance["start_time"],
        end_time=serialized_maintenance["end_time"]
    )

async def send_maintenance_update_notifications(
    maintenance_data: dict,
    org_name: str,
    supabase: any
):
    """
    Send notifications for maintenance update
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Create Maintenance model instance to ensure proper datetime serialization
    maintenance = Maintenance(**maintenance_data)
    serialized_maintenance = jsonable_encoder(maintenance)
    await manager.broadcast({
        "type": "updated_maintenance", 
        "data": serialized_maintenance, 
        "user_id": user.id
    }, org_id=maintenance_data["org_id"])
    
    send_org_notification(
        org_id=maintenance_data["org_id"],
        action="updated",
        entity_type="Maintenance",
        entity_name=maintenance_data["title"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        start_time=serialized_maintenance["start_time"],
        end_time=serialized_maintenance["end_time"]
    )
    
async def send_maintenance_delete_notifications(
    maintenance_data: dict,
    org_name: str,
    supabase: any
):
    """
    Send notifications for maintenance deletion
    """
    user = supabase.auth.get_user().user
    
    # Get user name
    user_name = f"{user.user_metadata.get('first_name', '')} {user.user_metadata.get('last_name', '')}".strip()
    if not user_name:
        user_name = user.email
    
    # Run websocket broadcast and email notification
    await manager.broadcast({
        "type": "deleted_maintenance", 
        "data": {"id": maintenance_data["id"]}, 
        "user_id": user.id
    }, org_id=maintenance_data["org_id"])
    
    # Use jsonable_encoder for proper datetime serialization
    maintenance = Maintenance(**maintenance_data)
    serialized_maintenance = jsonable_encoder(maintenance)
    
    send_org_notification(
        org_id=maintenance_data["org_id"],
        action="deleted",
        entity_type="Maintenance",
        entity_name=maintenance_data["title"],
        user_name=user_name,
        org_name=org_name,
        exclude_user_id=user.id,
        start_time=serialized_maintenance["start_time"],
        end_time=serialized_maintenance["end_time"]
    ) 