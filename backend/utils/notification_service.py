from typing import List, Optional
import logging
from .send_email import send_emails
from .email_templates import generate_notification_email
from supabase_client import get_admin_client

logger = logging.getLogger(__name__)

async def send_org_notification(
    org_id: str,
    action: str,
    entity_type: str,
    entity_name: str,
    user_name: str,
    org_name: str,
    additional_details: str = "",
    exclude_user_id: Optional[str] = None
):
    """
    Send email notifications to all users in an organization
    
    Args:
        org_id: Organization ID
        action: Action performed (created, updated, deleted, etc.)
        entity_type: Type of entity (Application, Incident, Maintenance, etc.)
        entity_name: Name of the entity
        user_name: Name of the user who performed the action
        org_name: Name of the organization
        additional_details: Additional details about the action
        exclude_user_id: User ID to exclude from notifications (usually the user who performed the action)
    """
    try:
        # Get admin client to access user data
        admin_client = get_admin_client()
        
        # Get all users in the organization
        org_users_response = admin_client.rpc("get_users_for_org", {"org_id": org_id}).execute()
        
        if not org_users_response.data:
            logger.warning(f"No users found for organization {org_id}")
            return
        
        # Extract email addresses, excluding the user who performed the action
        user_emails = []
        for user_data in org_users_response.data:
            if exclude_user_id and user_data.get("id") == exclude_user_id:
                continue
            
            email = user_data.get("email")
            if email:
                user_emails.append(email)
        
        if not user_emails:
            logger.info(f"No other users to notify in organization {org_id}")
            return
        
        # Generate email content
        html_body, text_body = generate_notification_email(
            action=action,
            entity_type=entity_type,
            entity_name=entity_name,
            user_name=user_name,
            org_name=org_name,
            additional_details=additional_details
        )
        
        # Create subject
        emoji_map = {
            ("Application", "created"): "📱",
            ("Application", "updated"): "🔄",
            ("Application", "deleted"): "🗑️",
            ("Incident", "created"): "🚨",
            ("Incident", "updated"): "📝",
            ("Incident", "resolved"): "✅",
            ("Incident", "deleted"): "✅",
            ("Maintenance", "created"): "🔧",
            ("Maintenance", "updated"): "🔧",
            ("Maintenance", "deleted"): "🗑️",
            ("Log", "created"): "📝",
        }
        
        emoji = emoji_map.get((entity_type, action), "📋")
        subject = f"{emoji} {entity_type} {action} in {org_name}"
        
        # Send emails
        send_emails(
            to_emails=user_emails,
            subject=subject,
            html_body=html_body,
            text_body=text_body
        )
        
        logger.info(f"Sent notification emails to {len(user_emails)} users for {entity_type} {action} in org {org_id}")
        
    except Exception as e:
        logger.error(f"Failed to send notification emails for org {org_id}: {str(e)}")
        # Don't raise the exception to avoid breaking the main webhook functionality 