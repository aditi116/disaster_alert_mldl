import requests

API_BASE = 'http://localhost:8081/api'

def login():
    res = requests.post(f"{API_BASE}/auth/login", json={"username": "testuser", "password": "test123"})
    res.raise_for_status()
    return res.json()['token']

def create_alert(token, title, lat, lng):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": title,
        "description": "Need medical resource nearby",
        "latitude": lat,
        "longitude": lng,
        "alertTypeId": 3, # Medical
        "severity": 5
    }
    return requests.post(f"{API_BASE}/alerts", json=payload, headers=headers)

def create_resource(token, title, lat, lng):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": title,
        "description": "KNN resource match test",
        "latitude": lat,
        "longitude": lng,
        "resourceTypeId": 3, # Medical Supplies
        "status": "AVAILABLE",
        "contactInfo": "Dial 112"
    }
    return requests.post(f"{API_BASE}/resources", json=payload, headers=headers)

if __name__ == '__main__':
    print("Authenticating as testuser...")
    token = login()
    
    # Reference Center (NYC Coordinates)
    c_lat, c_lng = 40.7128, -74.0060
    
    print("Creating central alert in NYC...")
    res = create_alert(token, "Medical Emergency at Times Square", c_lat, c_lng)
    
    if res.status_code not in [200, 201]:
        print("Failed to create alert", res.text)
        exit()
        
    print("Scattering 4 AVAILABLE resources around the alert...")
    
    # Roughly mapping 1 degree lat/lng to ~110km. 
    # ~0.009 = 1km, ~0.027 = 3km, ~0.09 = 10km, ~0.27 = 30km
    resources = [
        {"title": "Ambulance Unity (1km radius - GREEN)", "lat": c_lat + 0.009, "lng": c_lng + 0.009},
        {"title": "Mobile Clinic (3km radius - GREEN)", "lat": c_lat + 0.027, "lng": c_lng - 0.027},
        {"title": "City Hospital (10km radius - YELLOW)", "lat": c_lat - 0.09, "lng": c_lng + 0.09},
        {"title": "County Med Depot (30km radius - ORANGE)", "lat": c_lat + 0.27, "lng": c_lng + 0.27}
    ]
    
    for i, req in enumerate(resources):
        r = create_resource(token, req['title'], req['lat'], req['lng'])
        print(f"Resource {i+1} built: {r.status_code}")
    
    print("\nDone. When this NYC alert is opened in the frontend platform, the KNN engine will correctly rank and color-code these resources.")
