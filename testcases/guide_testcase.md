# Test Cases Guide: ML Implementation Verification

## Quick Reference

| File | ML Method | What It Tests | Run | Expected |
|------|-----------|---------------|-----|----------|
| `demo_credibility.py` | Naive Bayes | Text classification (CREDIBLE/SUSPICIOUS/SPAM) | `python demo_credibility.py` | 9 alerts with labels |
| `demo_hotspots.py` | K-Means | Geographic clustering (3 cities, 19 alerts) | `python demo_hotspots.py` | Red circles on map |
| `demo_knn_duplicates.py` | KNN (Euclidean) | Similar alert detection | `python demo_knn_duplicates.py` | Similarity ranking |
| `demo_knn_resources.py` | KNN (Haversine) | Resource matching (K=3) | `python demo_knn_resources.py` | 3 nearest resources |
| `demo_reputation.py` | Reputation Points | Point accumulation (+80, -15 = 65) | `python demo_reputation.py` | User score = 65 |
| `reset_db.py` | DB Cleanup | Clear demo data | `python reset_db.py` | Tables truncated |

## Setup

```bash
pip install requests
cd testcases/
python reset_db.py  # Optional: clear old data
```

## Test Details

### 1. `demo_credibility.py` — Naive Bayes
- **Algorithm:** Bag-of-words + Laplace smoothing (α=1.0) + feature binning
- **Data:** 9 alerts (3 CREDIBLE with emergency keywords, 3 SUSPICIOUS with vague language, 3 SPAM)
- **Verify:** Check Dashboard for credibility badges (green/yellow/red icons on alert cards)

### 2. `demo_hotspots.py` — K-Means Clustering
- **Algorithm:** K=min(5, alertCount), Euclidean distance, convergence < 0.0001°
- **Data:** 3 tight clusters (Delhi 8 alerts, Mumbai 6, Bangalore 5)
- **Verify:** Open Dashboard map → RED DASHED CIRCLES show hotspots after 10 seconds

### 3. `demo_knn_duplicates.py` — KNN Alert Similarity
- **Algorithm:** 4D normalized space (lat, lng, severity, type), K=5, distance < 0.4 = duplicate
- **Data:** 8 alerts (2 similar clusters + 2 isolated)
- **Verify:** Create alert modal shows "Similar Alerts" warnings while typing

### 4. `demo_knn_resources.py` — KNN Resource Matching
- **Algorithm:** Haversine distance (Earth radius 6371km), K=3, AVAILABLE status filter
- **Data:** 1 medical alert at NYC + 5 resources at varying distances
- **Verify:** Click medical alert → "Nearest Resources" panel shows top 3 by distance

### 5. `demo_reputation.py` — Reputation System
- **Algorithm:** Point clamping at minimum 0, ALERT_CONFIRMED +10, LOW_RELIABILITY -5
- **Data:** 8 upvotes (+80) + 3 downvotes (-15) = 65 total points
- **Verify:** Check Dashboard reputation modal for testuser score ≈ 65

## Run Tests

```bash
# Individual test
python demo_credibility.py

# Full workflow
python reset_db.py
python demo_credibility.py
python demo_hotspots.py
python demo_knn_duplicates.py
python demo_knn_resources.py
python demo_reputation.py
```

## Verify in Dashboard

- Credibility badges on alert cards ✓
- Red dashed circles on map ✓
- Similar alerts warning in create modal ✓
- Nearest resources panel on alert selection ✓
- User reputation score visible ✓

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth failed | Ensure `testuser:test123` in DB |
| No hotspots | Wait 10s or restart backend (K-Means runs every 10 min) |
| No similar alerts | Need ≥5 alerts in DB |
| No resources | Check status='AVAILABLE' and valid lat/lng |

---
Last Updated: April 20, 2026
