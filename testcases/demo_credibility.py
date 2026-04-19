import requests

API_BASE = 'http://localhost:8081/api'

def login():
    res = requests.post(f"{API_BASE}/auth/login", json={"username": "testuser", "password": "test123"})
    res.raise_for_status()
    return res.json()['token']

def create_alert(token, title, description, lat, lng, alert_type, severity):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "title": title,
        "description": description,
        "latitude": lat,
        "longitude": lng,
        "alertTypeId": alert_type,
        "severity": severity
    }
    res = requests.post(f"{API_BASE}/alerts", json=payload, headers=headers)
    return res

if __name__ == '__main__':
    print("Authenticating as testuser...")
    try:
        token = login()
    except Exception as e:
        print(f"Authentication failed: {e}")
        exit(1)
        
    alerts = [
        # CREDIBLE
        {"title": "Severe Building Fire", "desc": "Severe building fire, people trapped inside. Massive flames.", "type": 1},
        {"title": "Urgent Flood Evacuation", "desc": "Major flooding near the river, urgent evacuation needed immediately.", "type": 2},
        # SUSPICIOUS
        {"title": "Fire maybe?", "desc": "Maybe a fire over there? Not sure, saw some smoke.", "type": 1},
        {"title": "Explosion noise?", "desc": "Did someone hear an explosion or just fireworks?", "type": 5},
        # SPAM
        {"title": "Extinguishers for sale", "desc": "Buy cheap fire extinguishers here, best price! Visit my link now.", "type": 1}
    ]
    
    print("Injecting NLP test alerts to evaluate Naive Bayes engine...")
    for i, a in enumerate(alerts):
        # Slightly offset coordinates for each to not stack them perfectly
        res = create_alert(token, a['title'], a['desc'], 19.0 + (i*0.1), 72.8, a['type'], 3)
        if res.status_code in [200, 201]:
            data = res.json()
            label = data.get('credibilityLabel', 'UNKNOWN')
            conf = data.get('credibilityConfidence', 0.0)
            print(f"Alert {i+1} injected! -> Label: {label} | Confidence: {conf:.2f}")
        else:
            print(f"Failed to inject Alert {i+1}: {res.status_code}")
