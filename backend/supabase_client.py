import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # For admin ops

def get_user_supabase_client(access_token: str) -> Client:
    return create_client(SUPABASE_URL, access_token)

def get_admin_client() -> Client:
    return create_client(SUPABASE_URL, SERVICE_ROLE_KEY)