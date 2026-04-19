import requests
import random

API_BASE = 'http://localhost:8081/api'

def login():
    res = requests.post(f"{API_BASE}/auth/login", json={"username": "testuser", "password": "test123"})
    res.raise_for_status()
    return res.json()['token']

def create_alert(token, title, lat, lng):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": title,
        "description": "K-Means Hotspot Test",
        "latitude": lat,
        "longitude": lng,
        "alertTypeId": 4, # Power Outage
        "severity": random.randint(3, 5)
    }
    return requests.post(f"{API_BASE}/alerts", json=payload, headers=headers)

if __name__ == '__main__':
    print("Authenticating as testuser...")
    token = login()
    
    # Delhi Connaught Place area coordinates
    d_lat, d_lng = 28.6139, 77.2090
    print(f"Injecting 12 cluster alerts tightly around Delhi ({d_lat}, {d_lng})")
    
    for i in range(12):
        # Sprinkle alerts within an extremely tight ~2km offset bounds to guarantee K-Means triggers
        rand_lat = d_lat + random.uniform(-0.015, 0.015)
        rand_lng = d_lng + random.uniform(-0.015, 0.015)
        res = create_alert(token, f"Widespread Blackout Point {i+1}", rand_lat, rand_lng)
        
        if res.status_code in [200, 201]:
            print(f"Alert {i+1} injected successfully!")
            
    print("\nInjection complete. The K-Means background scheduler will aggregate these into a unified Red Hotspot visually clustered on the Global Map.")
