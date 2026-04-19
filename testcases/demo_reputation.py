import requests

API_BASE = 'http://localhost:8081/api'

def login(username, password):
    res = requests.post(f"{API_BASE}/auth/login", json={"username": username, "password": password})
    return res.json().get('token')

def register(username, email, password):
    payload = {
        "username": username,
        "email": email,
        "password": password,
        "firstName": "Test",
        "lastName": "Voter"
    }
    return requests.post(f"{API_BASE}/auth/register", json=payload)

def create_alert(token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": "Reputation Check Alert",
        "description": "Waiting for 10 upvotes to get +10 points ALERT_CONFIRMED.",
        "latitude": 30.0,
        "longitude": -30.0,
        "alertTypeId": 5,
        "severity": 1
    }
    res = requests.post(f"{API_BASE}/alerts", json=payload, headers=headers)
    return res.json()['id']

def upvote_alert(token, alert_id):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"isUpvote": True}
    return requests.post(f"{API_BASE}/alerts/{alert_id}/vote", json=payload, headers=headers)

if __name__ == '__main__':
    print("Authenticating as base 'testuser'...")
    base_token = login("testuser", "test123")
    if not base_token:
        print("Login failed, ensure DB has 'testuser:test123'.")
        exit()
        
    print("Creating the base alert from 'testuser' to manipulate...")
    alert_id = create_alert(base_token)
    print(f"Created Alert #{alert_id}.")
    
    print("\nGenerative phase: Registering & Voting from 10 distinct programmatic user accounts...")
    for i in range(1, 11):
        uname = f"testvoter{i}"
        
        # 1. Registration
        register(uname, f"{uname}@example.com", "voter123")
        
        # 2. Login
        v_token = login(uname, "voter123")
        
        if not v_token:
            print(f"Error logging in voter {uname}.")
            continue
            
        # 3. Vote
        res = upvote_alert(v_token, alert_id)
        print(f"[{i}/10] User '{uname}' upvoted -> Status: {res.status_code}")
        
    print("\n✅ Target reached! The VoteService should have intercepted the 10th upvote and fired a ReputationEvent (ALERT_CONFIRMED, +10 points) securely mapped onto testuser's unified record.")
    print("Verify by opening the reputation UI modal on testuser in your Dashboard.")
