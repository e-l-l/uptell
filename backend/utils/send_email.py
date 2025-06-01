import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from typing import List

def send_emails(to_emails: List[str], subject: str, html_body: str, text_body: str):
    from_email = "prxthxm2@gmail.com"
    app_password = os.getenv("GMAIL_APP_PASSWORD")
    # Create message container
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = ", ".join(to_emails)

    text_part = MIMEText(text_body, "plain")

    html_part = MIMEText(html_body, "html")

    msg.attach(text_part)
    msg.attach(html_part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(from_email, app_password)
        server.sendmail(from_email, to_emails, msg.as_string())