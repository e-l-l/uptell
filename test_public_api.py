#!/usr/bin/env python3
"""
Simple test script to verify public API endpoints work without authentication
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, description):
    """Test a single endpoint and print results"""
    print(f"\n🧪 Testing: {description}")
    print(f"📍 Endpoint: {endpoint}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
        print(f"✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📦 Response: {json.dumps(data, indent=2)[:200]}...")
            return data
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on localhost:8000")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def main():
    print("🚀 Testing Public API Endpoints")
    print("=" * 50)
    
    # Test organizations endpoint
    orgs_data = test_endpoint("/public/organizations", "List Organizations")
    
    if orgs_data and len(orgs_data) > 0:
        org_id = orgs_data[0]["id"]
        print(f"\n📋 Using organization ID: {org_id}")
        
        # Test all other endpoints with the first organization
        test_endpoint(f"/public/stats/{org_id}/services", "Organization Services")
        test_endpoint(f"/public/stats/{org_id}/incidents/summary", "Incidents Summary")
        test_endpoint(f"/public/stats/{org_id}/incidents/timeline", "Incidents Timeline")
        test_endpoint(f"/public/stats/{org_id}/overview", "Complete Overview")
    else:
        print("\n❌ No organizations found or error occurred")
        print("💡 Make sure you have organizations in your database")
    
    print("\n✅ Public API test completed!")

if __name__ == "__main__":
    main() 