#!/usr/bin/env python3
"""
Backend API Tests for HUB3 Lab Sanity Routes
Tests graceful fallback mode (Sanity ENV VARS not configured)
"""
import requests
import json
import sys

# Base URL from .env
BASE_URL = "https://hub3-deploy.preview.emergentagent.com"

def print_test_header(test_name):
    print(f"\n{'='*80}")
    print(f"TEST: {test_name}")
    print(f"{'='*80}")

def print_result(passed, message):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")
    return passed

def test_arcade_leaderboard():
    """Test GET /api/arcade/leaderboard"""
    print_test_header("GET /api/arcade/leaderboard")
    
    try:
        url = f"{BASE_URL}/api/arcade/leaderboard"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        # Check status code
        if not print_result(response.status_code == 200, f"Status code is 200"):
            return False
        
        # Check JSON structure
        data = response.json()
        if not print_result(data.get('ok') == True, "Response has ok: true"):
            return False
        
        if not print_result(data.get('configured') == False, "Response has configured: false"):
            return False
        
        if not print_result('leaderboard' in data, "Response has leaderboard field"):
            return False
        
        if not print_result(data.get('leaderboard') == [], "Leaderboard is empty array"):
            return False
        
        print_result(True, "All checks passed")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_matchmaker_questions():
    """Test GET /api/matchmaker/questions"""
    print_test_header("GET /api/matchmaker/questions")
    
    try:
        url = f"{BASE_URL}/api/matchmaker/questions"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        # Check status code
        if not print_result(response.status_code == 200, "Status code is 200"):
            return False
        
        # Check JSON structure
        data = response.json()
        if not print_result(data.get('ok') == True, "Response has ok: true"):
            return False
        
        if not print_result(data.get('configured') == False, "Response has configured: false"):
            return False
        
        if not print_result('questions' in data, "Response has questions field"):
            return False
        
        if not print_result(data.get('questions') == [], "Questions is empty array"):
            return False
        
        print_result(True, "All checks passed")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_portfolio_projects():
    """Test GET /api/portfolio/projects"""
    print_test_header("GET /api/portfolio/projects")
    
    try:
        url = f"{BASE_URL}/api/portfolio/projects"
        print(f"Request: GET {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")
        
        # Check status code
        if not print_result(response.status_code == 200, "Status code is 200"):
            return False
        
        # Check JSON structure
        data = response.json()
        if not print_result(data.get('ok') == True, "Response has ok: true"):
            return False
        
        if not print_result(data.get('configured') == False, "Response has configured: false"):
            return False
        
        if not print_result('projects' in data, "Response has projects field"):
            return False
        
        if not print_result(data.get('projects') == [], "Projects is empty array"):
            return False
        
        print_result(True, "All checks passed")
        return True
        
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        return False

def test_arcade_lead_validation():
    """Test POST /api/arcade/lead validation cases"""
    print_test_header("POST /api/arcade/lead - Validation Tests")
    
    all_passed = True
    
    # Test 1: Empty body
    print("\n--- Test 1: Empty body ---")
    try:
        url = f"{BASE_URL}/api/arcade/lead"
        response = requests.post(url, json={}, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 400, "Status code is 400"):
            all_passed = False
        else:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if not print_result('nickname' in error_msg and 'required' in error_msg, 
                              "Error mentions nickname required"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 2: Missing email
    print("\n--- Test 2: Missing email ---")
    try:
        url = f"{BASE_URL}/api/arcade/lead"
        response = requests.post(url, json={"nickname": "TestUser"}, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 400, "Status code is 400"):
            all_passed = False
        else:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if not print_result('email' in error_msg, "Error mentions email"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 3: Missing phone
    print("\n--- Test 3: Missing phone ---")
    try:
        url = f"{BASE_URL}/api/arcade/lead"
        response = requests.post(url, json={
            "nickname": "TestUser",
            "email": "user@hub3.lab"
        }, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 400, "Status code is 400"):
            all_passed = False
        else:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if not print_result('phone' in error_msg, "Error mentions phone"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 4: Negative score
    print("\n--- Test 4: Negative score ---")
    try:
        url = f"{BASE_URL}/api/arcade/lead"
        response = requests.post(url, json={
            "nickname": "TestUser",
            "email": "user@hub3.lab",
            "phone": "+5511999999999",
            "score": -3
        }, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 400, "Status code is 400"):
            all_passed = False
        else:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if not print_result('score' in error_msg and 'non-negative' in error_msg, 
                              "Error mentions score must be non-negative"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 5: Invalid score (string)
    print("\n--- Test 5: Invalid score (string) ---")
    try:
        url = f"{BASE_URL}/api/arcade/lead"
        response = requests.post(url, json={
            "nickname": "TestUser",
            "email": "user@hub3.lab",
            "phone": "+5511999999999",
            "score": "not-a-number"
        }, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 400, "Status code is 400"):
            all_passed = False
        else:
            data = response.json()
            error_msg = data.get('error', '').lower()
            if not print_result('score' in error_msg and 'number' in error_msg, 
                              "Error mentions score must be a number"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 6: Valid payload (graceful fallback mode)
    print("\n--- Test 6: Valid payload (graceful fallback) ---")
    try:
        url = f"{BASE_URL}/api/arcade/lead"
        response = requests.post(url, json={
            "nickname": "TestUser",
            "email": "user@hub3.lab",
            "phone": "+5511999999999",
            "score": 1500
        }, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 200, "Status code is 200"):
            all_passed = False
        else:
            data = response.json()
            if not print_result(data.get('ok') == True, "Response has ok: true"):
                all_passed = False
            if not print_result(data.get('configured') == False, "Response has configured: false"):
                all_passed = False
            if not print_result(data.get('updated') == False, "Response has updated: false"):
                all_passed = False
            if not print_result('lead' in data, "Response has lead field"):
                all_passed = False
            else:
                lead = data.get('lead', {})
                if not print_result(lead.get('nickname') == 'TestUser', "Lead has correct nickname"):
                    all_passed = False
                if not print_result(lead.get('score') == 1500, "Lead has correct score"):
                    all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    if all_passed:
        print_result(True, "All validation tests passed")
    return all_passed

def test_revalidate_webhook():
    """Test POST /api/revalidate/sanity webhook"""
    print_test_header("POST /api/revalidate/sanity - Webhook Tests")
    
    all_passed = True
    
    # Test 1: Missing SANITY_REVALIDATE_SECRET (should return 500)
    print("\n--- Test 1: Missing SANITY_REVALIDATE_SECRET ---")
    try:
        url = f"{BASE_URL}/api/revalidate/sanity"
        response = requests.post(url, json={}, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 500, "Status code is 500"):
            all_passed = False
        else:
            data = response.json()
            if not print_result(data.get('ok') == False, "Response has ok: false"):
                all_passed = False
            error_msg = data.get('error', '').lower()
            if not print_result('sanity_revalidate_secret' in error_msg, 
                              "Error mentions SANITY_REVALIDATE_SECRET"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    if all_passed:
        print_result(True, "Webhook tests passed")
    return all_passed

def test_catch_all_routes():
    """Test catch-all /api/[[...path]] routes"""
    print_test_header("Catch-all /api/[[...path]] Routes")
    
    all_passed = True
    
    # Test 1: GET /api/ping
    print("\n--- Test 1: GET /api/ping ---")
    try:
        url = f"{BASE_URL}/api/ping"
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 200, "Status code is 200"):
            all_passed = False
        else:
            data = response.json()
            if not print_result(data.get('ok') == True, "Response has ok: true"):
                all_passed = False
            if not print_result(data.get('service') == 'hub3-lab', "Response has service: hub3-lab"):
                all_passed = False
            if not print_result('path' in data, "Response has path field"):
                all_passed = False
            # Path should be ['ping']
            path = data.get('path', [])
            if not print_result(path == ['ping'], f"Path is ['ping'], got {path}"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    # Test 2: POST /api/anything with body
    print("\n--- Test 2: POST /api/anything with body ---")
    try:
        url = f"{BASE_URL}/api/anything"
        response = requests.post(url, json={"hello": "world"}, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if not print_result(response.status_code == 200, "Status code is 200"):
            all_passed = False
        else:
            data = response.json()
            if not print_result(data.get('ok') == True, "Response has ok: true"):
                all_passed = False
            if not print_result('received' in data, "Response has received field"):
                all_passed = False
            received = data.get('received', {})
            if not print_result(received.get('hello') == 'world', "Received body echoed back"):
                all_passed = False
            if not print_result('path' in data, "Response has path field"):
                all_passed = False
            path = data.get('path', [])
            if not print_result(path == ['anything'], f"Path is ['anything'], got {path}"):
                all_passed = False
    except Exception as e:
        print_result(False, f"Exception: {str(e)}")
        all_passed = False
    
    if all_passed:
        print_result(True, "Catch-all route tests passed")
    return all_passed

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("HUB3 Lab Backend API Tests - Graceful Fallback Mode")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = {}
    
    # Run all tests
    results['arcade_leaderboard'] = test_arcade_leaderboard()
    results['matchmaker_questions'] = test_matchmaker_questions()
    results['portfolio_projects'] = test_portfolio_projects()
    results['arcade_lead_validation'] = test_arcade_lead_validation()
    results['revalidate_webhook'] = test_revalidate_webhook()
    results['catch_all_routes'] = test_catch_all_routes()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*80)
    print(f"Total: {passed}/{total} tests passed")
    print("="*80)
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()
