def generate_notification_email(
    action: str, 
    entity_type: str, 
    entity_name: str, 
    user_name: str, 
    org_name: str,
    additional_details: str = ""
) -> tuple[str, str]:
    """
    Generate HTML and text email templates for webhook notifications
    
    Args:
        action: The action performed (created, updated, deleted, etc.)
        entity_type: Type of entity (Application, Incident, Maintenance, etc.)
        entity_name: Name of the entity
        user_name: Name of the user who performed the action
        org_name: Name of the organization
        additional_details: Additional details about the action
    
    Returns:
        Tuple of (html_body, text_body)
    """
    
    # Determine emoji based on entity type and action
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
    
    # Create subject and title
    subject = f"{emoji} {entity_type} {action} in {org_name}"
    title = f"{entity_type} was {action}"
    
    # HTML email with inline styles for better email client compatibility
    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #0a0a0a; color: #fafafa; line-height: 1.5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #2d2d2d; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px; text-align: center; border-bottom: 1px solid #2d2d2d;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #fafafa; margin-bottom: 8px;">{emoji} {title}</h1>
                <p style="margin: 0; color: #a1a1aa; font-size: 14px;">Notification from {org_name}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
                <div style="background-color: #27272a; border: 1px solid #3f3f46; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                    <div style="font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 16px;">
                        {emoji} Update Summary
                    </div>
                    
                    <div style="background-color: #18181b; border: 1px solid #2d2d2d; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Entity Type:</span>
                            <span style="display: inline-block; background-color: #1f2937; color: #d1d5db; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid #374151;">{entity_type}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Action:</span>
                            <span style="display: inline-block; background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{action}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{entity_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Updated by:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{user_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Organization:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{org_name}</span>
                        </div>
                    </div>
                    
                    {f'<div style="background-color: #0f172a; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 6px 6px 0; margin-top: 16px;"><p style="color: #cbd5e1; font-size: 14px; margin: 0;">{additional_details}</p></div>' if additional_details else ''}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #18181b; padding: 24px 32px; text-align: center; border-top: 1px solid #2d2d2d;">
                <p style="color: #71717a; font-size: 12px; margin: 0;">This is an automated notification from your Uptell dashboard.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text_body = f"""
{subject}

{entity_type} was {action} by {user_name}

Details:
- Entity Type: {entity_type}
- Action: {action}
- Name: {entity_name}
- Updated by: {user_name}
- Organization: {org_name}

{f'Additional Information: {additional_details}' if additional_details else ''}

---
This is an automated notification from your Uptell dashboard.
    """
    
    return html_body, text_body 