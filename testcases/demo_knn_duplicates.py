import requests

API_BASE = 'http://localhost:8081/api'

def login():
    res = requests.post(f"{API_BASE}/auth/login", json={"username": "testuser", "password": "test123"})
    res.raise_for_status()
    return res.json()['token']

def create_alert(token, title, lat, lng, severity):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": title,
        "description": "KNN test duplicate data",
        "latitude": lat,
        "longitude": lng,
        "alertTypeId": 1, # Fire
        "severity": severity
    }
    return requests.post(f"{API_BASE}/alerts", json=payload, headers=headers)

if __name__ == '__main__':
    print("Authenticating as testuser...")
    token = login()
    
    # Base location (Mumbai urban center)
    base_lat, base_lng = 19.0760, 72.8777
    
    # 3 identical alerts tightly clustered
    alerts = [
        {"title": "Fire at Andheri West", "lat": base_lat + 0.0001, "lng": base_lng + 0.0001, "sev": 4},
        {"title": "Massive flames spotted", "lat": base_lat + 0.0002, "lng": base_lng - 0.0001, "sev": 5},
        {"title": "Smoke coming from building", "lat": base_lat - 0.0001, "lng": base_lng + 0.0002, "sev": 3}
    ]
    
    print("Injecting extremely close KNN duplicate alerts in Mumbai...")
    for i, a in enumerate(alerts):
        res = create_alert(token, a['title'], a['lat'], a['lng'], a['sev'])
        if res.status_code in [200, 201]:
            print(f"Alert {i+1} injected successfully at {a['lat']}, {a['lng']}")
        else:
            print(f"Failed: {res.status_code}")
    
    print("\nNext, test GET /ml/knn/similar-alerts from the frontend (or manually) using matching coords.")
