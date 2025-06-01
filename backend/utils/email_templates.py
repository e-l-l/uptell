from typing import Dict, Any

def generate_notification_email(email_data: Dict[str, Any]) -> tuple[str, str]:
    """
    Generate HTML and text email templates for webhook notifications
    
    Args:
        email_data: Dictionary containing all notification data
    
    Returns:
        Tuple of (html_body, text_body)
    """
    
    action = email_data["action"]
    entity_type = email_data["entity_type"]
    entity_name = email_data["entity_name"]
    user_name = email_data["user_name"]
    org_name = email_data["org_name"]
    additional_details = email_data.get("additional_details", "")
    
    # Determine emoji based on entity type and action
    emoji_map = {
        ("Application", "created"): "📱",
        ("Application", "updated"): "🔄",
        ("Application", "deleted"): "🗑️",
        ("Incident", "created"): "🚨",
        ("Incident", "updated"): "📝",
        ("Incident", "resolved"): "✅",
        ("Incident", "deleted"): "🗑️",
        ("Maintenance", "created"): "🔧",
        ("Maintenance", "updated"): "🔧",
        ("Maintenance", "deleted"): "🗑️",
        ("Log", "created"): "📝",
        ("Log", "updated"): "📝",
        ("Log", "deleted"): "🗑️",
    }
    
    emoji = emoji_map.get((entity_type, action), "📋")
    
    # Create subject and title
    subject = f"{emoji} {entity_type} {action} in {org_name}"
    title = f"{entity_type} was {action}"
    
    # Generate specific content based on entity type and action
    specific_details = _generate_specific_details(email_data)
    
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
                        {emoji} {entity_name}
                    </div>
                    
                    <div style="background-color: #18181b; border: 1px solid #2d2d2d; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Action:</span>
                            <span style="display: inline-block; background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{action}</span>
                        </div>
                        {specific_details["html"]}
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">{action.title()} by:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{user_name}</span>
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
- Action: {action}
{specific_details["text"]}
- {action.title()} by: {user_name}

{f'Additional Information: {additional_details}' if additional_details else ''}

---
This is an automated notification from your Uptell dashboard.
    """
    
    return html_body, text_body

def _generate_specific_details(email_data: Dict[str, Any]) -> Dict[str, str]:
    """Generate specific details based on entity type and action"""
    entity_type = email_data["entity_type"]
    action = email_data["action"]
    entity_name = email_data["entity_name"]
    
    html_details = ""
    text_details = ""
    
    if entity_type == "Application":
        if action in ["created", "updated", "deleted"]:
            # Application name, Status, created/updated/deleted By
            status = email_data.get("status", "Unknown")
            html_details = f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Application Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{entity_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Status:</span>
                            <span style="display: inline-block; background-color: #1f2937; color: #d1d5db; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; border: 1px solid #374151;">{status}</span>
                        </div>"""
            text_details = f"""- Application Name: {entity_name}
- Status: {status}"""
    
    elif entity_type == "Incident":
        if action == "created":
            # Incident Name, on Which Application, Status, by whom
            application_name = email_data.get("application_name", "Unknown Application")
            status = email_data.get("status", "Unknown")
            html_details = f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Incident Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{entity_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Application:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{application_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Status:</span>
                            <span style="display: inline-block; background-color: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;">{status}</span>
                        </div>
                        """
            text_details = f"""- Incident Name: {entity_name}
- Application: {application_name}
- Status: {status}"""
        
        elif action in ["updated", "deleted", "resolved"]:
            # Incident Name, New Status, updated by
            status = email_data.get("status", "Unknown")
            status_color = "#16a34a" if action == "resolved" else "#dc2626"  # Green for resolved, red for others
            html_details = f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Incident Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{entity_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">{'Final ' if action == 'resolved' else 'New ' if action == 'updated' else ''}Status:</span>
                            <span style="display: inline-block; background-color: {status_color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;">{status}</span>
                        </div>"""
            text_details = f"""- Incident Name: {entity_name}
- {'Final ' if action == 'resolved' else 'New ' if action == 'updated' else ''}Status: {status}
"""
    
    elif entity_type == "Log":
        if action in ["created", "updated", "deleted"]:
            # Incident Name, status of log, created/updated/deleted by
            incident_name = email_data.get("incident_name", "Unknown Incident")
            log_status = email_data.get("log_status", "Unknown")
            html_details = f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Incident Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{incident_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Log Status:</span>
                            <span style="display: inline-block; background-color: #0ea5e9; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;">{log_status}</span>
                        </div>"""
            text_details = f"""- Incident Name: {incident_name}
- Log Status: {log_status}"""
    
    elif entity_type == "Maintenance":
        if action == "created":
            # Name of maintenance, start time, end time, by whom
            start_time = email_data.get("start_time", "Unknown")
            end_time = email_data.get("end_time", "Unknown")
            html_details = f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Maintenance Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{entity_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Start Time:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{start_time}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">End Time:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{end_time}</span>
                        </div>"""
            text_details = f"""- Maintenance Name: {entity_name}
- Start Time: {start_time}
- End Time: {end_time}"""
        
        elif action in ["updated", "deleted"]:
            # Name of maintenance, status/details, updated/deleted by
            status = email_data.get("status", "Unknown")
            start_time = email_data.get("start_time", "Unknown")
            end_time = email_data.get("end_time", "Unknown")
            html_details = f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Maintenance Name:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{entity_name}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Status:</span>
                            <span style="display: inline-block; background-color: #7c3aed; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500;">{status}</span>
                        </div>"""
            if start_time != "Unknown":
                html_details += f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">Start Time:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{start_time}</span>
                        </div>"""
            if end_time != "Unknown":
                html_details += f"""
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <span style="color: #a1a1aa; font-size: 14px; font-weight: 500;">End Time:</span>
                            <span style="color: #fafafa; font-size: 14px; font-weight: 600;">{end_time}</span>
                        </div>"""
            text_details = f"""- Maintenance Name: {entity_name}
- Status: {status}"""
            if start_time != "Unknown":
                text_details += f"\n- Start Time: {start_time}"
            if end_time != "Unknown":
                text_details += f"\n- End Time: {end_time}"
    
    return {
        "html": html_details,
        "text": text_details
    } 