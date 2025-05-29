import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # For admin ops
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
def get_user_supabase_client(access_token: str) -> Client:
    client= create_client(SUPABASE_URL, ANON_KEY)
    client.auth.set_session(access_token, access_token)
    return client

def get_admin_client() -> Client:
    return create_client(SUPABASE_URL, SERVICE_ROLE_KEY)