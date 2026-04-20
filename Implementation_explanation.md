# ResQNet - ML Algorithms Implementation

This document provides detailed explanations of the four Machine Learning algorithms implemented in the ResQNet disaster alert platform, why they are necessary, and how they help the system.

---

## Table of Contents

1. [Naive Bayes Classifier - Alert Credibility Analysis](#naive-bayes-classifier---alert-credibility-analysis)
2. [Decision Trees - Severity Prediction & Alert Escalation](#decision-trees---severity-prediction--alert-escalation)
3. [K-Means Clustering - Disaster Hotspot Detection](#k-means-clustering---disaster-hotspot-detection)
4. [K-Nearest Neighbors - Duplicate Detection & Resource Matching](#k-nearest-neighbors---duplicate-detection--resource-matching)

---

## Naive Bayes Classifier - Alert Credibility Analysis

### Why Naive Bayes is Needed

In a crowdsourced disaster alert system, not all reports are reliable. Users may:
- Post **SPAM**: Commercial advertisements or test messages (e.g., "Buy fire extinguishers here!")
- Post **SUSPICIOUS**: Vague, unconfirmed information (e.g., "Might be a fire somewhere?")
- Post **CREDIBLE**: Specific, urgent, detailed reports (e.g., "Severe building fire downtown, people trapped")

Without automated credibility analysis, admins would need to manually verify every alert, creating bottlenecks during emergencies. Naive Bayes enables **instant classification**, helping users quickly identify trustworthy information and allowing admins to prioritize genuine emergencies.

### Implementation

**Location:** `backend/src/main/java/com/disasteralert/ml/service/NaiveBayesCredibilityService.java`

**Controller:** `backend/src/main/java/com/disasteralert/ml/controller/CredibilityController.java`

**Integration Point:** Automatically invoked in `AlertService.createAlert()` when user creates a new alert

### Algorithm Breakdown

#### 1. Training Data (45 samples, hardcoded)

**CREDIBLE Examples (15 samples):**
- "Major fire downtown building casualties reported"
- "Flood waters rising rapidly on riverside road near bridge"
- "Building collapse people trapped need rescue immediately"
- "Gas pipeline explosion evacuate surrounding area now"
- "Landslide blocking highway emergency vehicles cannot pass"

**SUSPICIOUS Examples (15 samples):**
- "Something strange near old factory not sure what"
- "Think there might be fire somewhere in north area"
- "Heard loud sounds could be explosion not confirmed"
- "Smoke visible direction unclear if serious or not"
- "Not sure power out in some areas of city possibly"

**SPAM Examples (15 samples):**
- "Free food giveaway at community center come get it"
- "Visit website for best disaster preparedness products"
- "Testing testing this is just a test please ignore"
- "Buy emergency supplies from store best quality guaranteed"

#### 2. Feature Engineering

Three feature types extracted from each alert:

**Feature 1: Text Content**
```
Input: "Massive fire building with people trapped inside urgent help needed"

Process:
1. Convert to lowercase
2. Split into words: ["massive", "fire", "building", "with", "people", "trapped", "inside", "urgent", "help", "needed"]
3. Remove stopwords (the, is, a, in, on, etc.): ["massive", "fire", "building", "people", "trapped", "inside", "urgent", "help", "needed"]
4. Track word frequency per class during training

Training Phase:
- CREDIBLE class: word "fire" appears in 8/15 samples
- SUSPICIOUS class: word "fire" appears in 2/15 samples
- SPAM class: word "fire" appears in 1/15 samples
```

**Feature 2: Post Count Bin (User Credibility Indicator)**
```
Binned as:
- Bin 0: User has 0 previous alerts
- Bin 1: User has 1 previous alert
- Bin 2: User has 2+ previous alerts

Training observation:
- CREDIBLE alerts: mostly from users with 1-2 prior alerts (experienced reporters)
- SUSPICIOUS alerts: mostly from users with 0 alerts (first-time posters)
- SPAM alerts: mixed, but often from 0-alert users
```

**Feature 3: Hour Bin (Temporal Pattern)**
```
Binned as:
- Bin 0: 00:00-06:00 (night, lower alert volume)
- Bin 1: 06:00-12:00 (morning, medium)
- Bin 2: 12:00-18:00 (afternoon, high)
- Bin 3: 18:00-24:00 (evening, high)

Training observation:
- Genuine emergencies reported across all hours
- SPAM tends toward off-peak hours (0, 1)
- No strong time correlation for SUSPICIOUS
```

#### 3. Naive Bayes Formula

```
P(Class|Features) = P(Features|Class) × P(Class) / P(Features)

Simplified (ignoring denominator):
P(Class|Features) ∝ P(Class) × P(word1|Class) × P(word2|Class) × ... × P(bin|Class)

Where:
- P(Class) = prior probability = count(Class) / total_samples
- P(word|Class) = (count(word in Class) + α) / (count(all words in Class) + α × vocabulary_size)
  → α = 1.0 (Laplace smoothing prevents zero probabilities)
- P(bin|Class) = similar calculation for feature bins
```

#### 4. Prediction Workflow

```
When user creates alert with description: "Severe flooding reported near bridge evacuation underway"

Step 1: Extract features
- Text: ["severe", "flooding", "reported", "bridge", "evacuation", "underway"]
- postCountBin: 1 (user's 2nd alert)
- hourBin: 2 (afternoon)

Step 2: Calculate class probabilities
P(CREDIBLE|Features) = P(CREDIBLE) × ∏ P(word|CREDIBLE) × P(bin1|CREDIBLE)
                     = 0.333 × 0.85 × 0.90 × 0.88 × 0.92 × 0.87 × 0.89 × 0.75
                     ≈ 0.042

P(SUSPICIOUS|Features) = 0.333 × 0.15 × 0.10 × 0.12 × 0.08 × 0.13 × 0.11 × 0.25
                       ≈ 0.000008

P(SPAM|Features) = 0.333 × 0.05 × 0.05 × 0.02 × 0.04 × 0.01 × 0.02 × 0.10
                 ≈ 0.0000001

Step 3: Select highest probability and normalize
Winner: CREDIBLE (0.042)
Normalized confidence: 0.042 / (0.042 + 0.000008 + 0.0000001) ≈ 0.9998

Step 4: Return result
{
  "credibilityLabel": "CREDIBLE",
  "credibilityConfidence": 0.9998
}
```

### Example Response in Alert

When user creates the above alert:

```json
{
  "id": 456,
  "title": "Severe flooding on Bridge Road",
  "description": "Severe flooding reported near bridge evacuation underway",
  "credibilityLabel": "CREDIBLE",
  "credibilityConfidence": 0.9998,
  "severity": 4,
  "status": "ACTIVE"
}
```

Frontend displays:
- Green "CREDIBLE" badge
- ✓ Checkmark icon
- Used in sorting/filtering (credible alerts appear first)

### Why This Helps ResQNet

1. **Immediate Spam Filtering:** Blocks obvious spam before it clutters the map
2. **User Confidence:** Users can trust alerts marked as CREDIBLE with high confidence
3. **Admin Efficiency:** Admins can focus on SUSPICIOUS alerts that need manual review
4. **Data Quality:** Ensures the K-Means clustering and KNN analysis operate on reliable data
5. **Reputation Alignment:** CREDIBLE alerts build the reporter's reputation faster

### Testing

Run `python testcases/demo_credibility.py` to inject 5 test alerts with different credibility levels and observe the classifier output.

---

## Decision Trees - Severity Prediction & Alert Escalation

### Why Decision Trees are Needed

Different disasters require different response levels. A power outage affecting a few streets (severity 2) needs different resources than a building collapse (severity 5). Problems:

1. **User Bias:** Users often misjudge severity. A user might rate their local power outage as 5, while a distant wildfire gets rated 2.
2. **Objective Assessment:** The system needs **automatic, unbiased** severity calculation based on concrete factors.
3. **Emergency Prioritization:** Admins need to know which alerts are truly critical for resource allocation.

Decision Trees solve this by using keyword analysis, alert type, location patterns, and nearby incident clustering to objectively determine severity.

### Implementation

**Location:** 
- `backend/src/main/java/com/disasteralert/ml/service/DecisionTreeSeverityService.java`
- `backend/src/main/java/com/disasteralert/ml/service/DecisionTreeEscalationService.java`

**Integration Point:** Invoked in `AlertService.createAlert()` immediately after Naive Bayes classification

### Tree 1: Severity Prediction (5-level classification)

#### Input Features

**Feature 1: Alert Type (Encoded)**
```
Fire             → 1  (typically high severity)
Flood            → 2  (depends on location/spread)
Medical Emergency → 3  (immediate response needed)
Power Outage     → 4  (lower severity, gradual impact)
Other            → 5  (unknown, treat carefully)
```

**Feature 2: Keyword Score (0-15)**
Count of emergency keywords in description:
```
Keywords: "fire", "trapped", "urgent", "help", "critical", "emergency", "danger",
          "flood", "collapse", "explosion", "evacuate", "rescue", "casualty", 
          "injury", "dead"

Example 1: "Major fire building collapse people trapped urgent rescue needed"
           → Contains: "fire" (1), "collapse" (1), "trapped" (1), "urgent" (1), "rescue" (1)
           → keyword_score = 5

Example 2: "Power issue near my house"
           → No matching keywords
           → keyword_score = 0
```

**Feature 3: Is Urban (Boolean)**
Checks if alert location is within 1° (≈111km) of 8 major Indian cities:
```
Mumbai (19.07°N, 72.87°E)
Delhi (28.67°N, 77.21°E)
Bangalore (12.97°N, 77.59°E)
Chennai (13.08°N, 80.27°E)
Kolkata (22.57°N, 88.36°E)
Hyderabad (17.38°N, 78.47°E)
Pune (23.02°N, 72.57°E)
Ahmedabad (23.02°N, 72.57°E)

Example: Alert at (19.10, 72.90)
→ Distance to Mumbai = √[(19.10-19.07)² + (72.90-72.87)²] ≈ 0.004°
→ is_urban = TRUE
```

**Feature 4: Nearby Count (Integer)**
Number of OTHER alerts within 5km of this alert's location:
```
SELECT COUNT(*) FROM alerts 
WHERE haversine_distance(latitude, longitude, query_lat, query_lng) <= 5
AND alert_id != current_alert_id

Example: 8 other alerts within 5km → nearby_count = 8
```

#### Decision Tree Structure

```
                    START (keyword_score check)
                           |
                ┌──────────┴──────────┐
                |                     |
         keyword >= 5          keyword < 5
                |                     |
            severity=5         BRANCH (keyword >= 3?)
                                      |
                ┌──────────────────────┴─────────────────┐
                |                                        |
            keyword >= 3                          keyword < 3
                |                                        |
         CHECK TYPE                              BRANCH (keyword >= 2?)
                |                                        |
        ┌───────┴────────┐                              |
        |                |                    ┌─────────┴──────────┐
    Fire/Medical      Others                  |                    |
        |                |              keyword >= 2         keyword < 2
    sev=5          sev=4                      |                    |
                                     CHECK URBAN & NEARBY       FINAL CHECK
                                              |                    |
                                    ┌─────────┴──────────┐        |
                                    |                    |         |
                              urban & nearby>=3    not urban    keyword==1?
                                    |                    |         |
                              sev=4 or 3            sev=3    ┌─────┴──────┐
                                                             |            |
                                                          urban      not urban
                                                             |            |
                                                         sev=3       sev=2
                                                                        |
                                                                   else sev=1
```

#### Decision Rules (Simplified)

```java
if (keyword_score >= 5) {
    return 5;  // Multiple critical keywords → Critical
}
else if (keyword_score >= 3) {
    return (type == FIRE || type == MEDICAL) ? 5 : 4;  // Emergency types
}
else if (keyword_score >= 2) {
    if (is_urban && nearby_count >= 3) {
        return 4;  // Urban area with cluster
    }
    return (type == FIRE || type == FLOOD) ? 3 : 3;  // Hazardous types
}
else if (keyword_score == 1) {
    return is_urban ? 3 : 2;  // Single keyword in urban = higher
}
else {  // keyword_score == 0
    return type == POWER ? 2 : 1;  // No keywords = minimal, except power
}
```

#### Example Predictions

```
Alert: "Severe fire downtown multiple buildings affected many casualties reported"
- type = Fire (1)
- keyword_score = 4 ("fire", "buildings", "casualties") 
- is_urban = TRUE (downtown)
- nearby_count = 2

Decision path: keyword_score >= 3 → CHECK TYPE → Fire → return 5
Result: severity = 5 (CRITICAL) ✓ Correct

---

Alert: "Power went out in my neighborhood"
- type = Power (4)
- keyword_score = 0 (no emergency keywords)
- is_urban = TRUE
- nearby_count = 0

Decision path: keyword_score == 0 → type == POWER → return 2
Result: severity = 2 (MINOR) ✓ Correct

---

Alert: "Something might be wrong near the old factory not sure"
- type = Other (5)
- keyword_score = 0 (no emergency keywords)
- is_urban = FALSE
- nearby_count = 0

Decision path: keyword_score == 0 → type != POWER → return 1
Result: severity = 1 (VERY LOW) ✓ Correct (vague report)
```

### Tree 2: Escalation Determination

After severity prediction, determine if alert needs immediate admin attention:

```java
public boolean shouldEscalate(String type, String description, 
                              double lat, double lng, int severity) {
    int encoded = encodeType(type);
    int keywords = computeKeywordScore(description);
    int nearby = computeNearbyCount(lat, lng);
    
    return severity >= 4              // High severity
        || keywords >= 3              // Multiple emergency keywords
        || nearby >= 5                // Cluster of incidents
        || (type == Fire && keywords >= 2);  // Any fire report with keywords
}
```

**Escalation Triggers:**
- Severity ≥ 4: All high-severity alerts auto-escalate
- 3+ emergency keywords: Likely genuine emergency
- 5+ nearby alerts: Indicates disaster cluster
- Fire + keywords: Fire always gets attention

### Integration in AlertService

```java
@Transactional
public Alert createAlert(AlertRequest request, User creator) {
    // 1. Validate input
    validateAlertRequest(request);
    
    // 2. Get alert type
    AlertType type = alertTypeRepository.findById(request.getAlertTypeId())
        .orElseThrow(() -> new ResourceNotFoundException("Alert type not found"));
    
    // 3. NAIVE BAYES: Credibility analysis
    CredibilityResultDTO credibility = naiveBayesService.predict(
        request.getDescription(),
        creator.getPostCount(),
        getCurrentHourBin()
    );
    
    // 4. DECISION TREE 1: Severity prediction
    int predictedSeverity = decisionTreeSeverityService.predictSeverity(
        type.getName(),
        request.getDescription(),
        request.getLatitude(),
        request.getLongitude()
    );
    
    // Use higher of user-provided or predicted severity
    int finalSeverity = Math.max(request.getSeverity(), predictedSeverity);
    
    // 5. DECISION TREE 2: Escalation check
    boolean shouldEscalate = decisionTreeEscalationService.shouldEscalate(
        type.getName(),
        request.getDescription(),
        request.getLatitude(),
        request.getLongitude(),
        finalSeverity
    );
    
    // 6. Create alert
    Alert alert = new Alert();
    alert.setTitle(request.getTitle());
    alert.setDescription(request.getDescription());
    alert.setAlertType(type);
    alert.setSeverity(finalSeverity);
    alert.setLatitude(request.getLatitude());
    alert.setLongitude(request.getLongitude());
    alert.setUser(creator);
    alert.setStatus(Alert.AlertStatus.ACTIVE);
    alert.setCredibilityLabel(credibility.getLabel());
    alert.setCredibilityConfidence(credibility.getConfidence());
    
    Alert saved = alertRepository.save(alert);
    
    // 7. If escalation needed, notify admins
    if (shouldEscalate) {
        notificationService.escalateToAdmins(saved);
        logger.warn("Alert {} escalated to admins - severity: {}, keywords: {}",
            saved.getId(), finalSeverity, 
            decisionTreeSeverityService.computeKeywordScore(request.getDescription()));
    }
    
    return saved;
}
```

### Why This Helps ResQNet

1. **Consistent Severity:** All alerts graded on same objective criteria, no user bias
2. **Smart Prioritization:** Admins see escalated high-severity alerts first
3. **Pattern Recognition:** Nearby incidents trigger higher severity (disaster clustering)
4. **Fast Triage:** Automatic classification happens in milliseconds
5. **Improved Response:** Resources dispatched based on AI assessment, not just user opinion

### Testing

Create alerts with varying descriptions and observe predicted severity vs. user input:
```
Alert 1: "Fire at downtown mall" → keyword_score=1, is_urban=TRUE → severity=3
Alert 2: "Major fire trapped people urgent evacuation" → keyword_score=5 → severity=5
Alert 3: "Something happened" → keyword_score=0 → severity=1
```

---

## K-Means Clustering - Disaster Hotspot Detection

### Why K-Means Clustering is Needed

During a disaster, many reports come in from the **same geographic area** - a building fire might trigger 20 nearby "fire" alerts, a flood might generate reports from all affected blocks. Without clustering:

1. **Map Clutter:** 20 individual markers make the map unreadable
2. **Redundant Processing:** Each marker processed separately, wasting resources
3. **Lost Patterns:** Difficult to see disaster epicenters and affected zones
4. **Poor Visualization:** Users can't quickly identify the most impacted areas

K-Means solves this by grouping geographically close alerts into **hotspots**, showing disaster concentrations at a glance.

### Implementation

**Location:** `backend/src/main/java/com/disasteralert/ml/service/KMeansClusteringService.java`

**Controller:** `backend/src/main/java/com/disasteralert/ml/controller/HotspotController.java`

**Execution:** Scheduled to run every 10 minutes via `@Scheduled(fixedRate = 600000)`

### Algorithm Breakdown

#### Step 1: Data Collection

```java
// Fetch all ACTIVE alerts from database
List<Alert> alerts = alertRepository.findByStatus(
    Alert.AlertStatus.ACTIVE, Pageable.unpaged()).getContent();

// Example: 23 active alerts across the city
// Each alert: [id, title, lat, lng, severity, type, ...]
```

#### Step 2: Initialize Centroids (K Selection)

```
K = Math.min(5, number_of_alerts)

Why 5? 
- Limits to max 5 hotspots (manageable visualization)
- Scales down for small alert counts (3 alerts → 3 clusters)
- Prevents over-clustering

Example with 23 alerts:
- K = 5 centroids
- Randomly pick 5 alerts as initial centroid seeds
- Extract their [latitude, longitude] coordinates
```

**Visual Example:**
```
City Map (simplified 10×10 grid)

Initial Alert Distribution:
    F F . . . . . . . .
    . . . . . . . M . .
    . . . . . . . . . .
    . . F . . . . . . F
    . . . . . . . . . .
    . . . . . . P . . .
    . . . . . . . . . .
    . . . . . . . . . .
    . . M . . . . . . .
    . . . . . . . . . F

Random 5 seed selection:
- Alert at (1,0): Centroid A
- Alert at (1,7): Centroid B
- Alert at (9,3): Centroid C
- Alert at (6,6): Centroid D
- Alert at (9,8): Centroid E
```

#### Step 3: Assignment Step (Iteration 1)

For each alert, calculate **Euclidean distance** to all centroids:

```
distance(alert, centroid) = √[(Δlat)² + (Δlng)²]

Example: Alert at (2,1) to all centroids:
- Distance to A(1,0) = √[(2-1)² + (1-0)²] = √2 ≈ 1.41 → CLOSEST
- Distance to B(1,7) = √[(2-1)² + (1-7)²] = √37 ≈ 6.08
- Distance to C(9,3) = √[(2-9)² + (1-3)²] = √53 ≈ 7.28
- Distance to D(6,6) = √[(2-6)² + (1-6)²] = √41 ≈ 6.40
- Distance to E(9,8) = √[(2-9)² + (1-8)²] = √130 ≈ 11.40

Assign alert(2,1) to Cluster A (nearest centroid)
```

After assigning all 23 alerts to nearest centroids:
```
Cluster A: 7 alerts (row 0-2, col 0-2)
Cluster B: 3 alerts (row 1, col 7-8)
Cluster C: 4 alerts (row 3-4, col 8-9)
Cluster D: 2 alerts (row 5-6, col 6-7)
Cluster E: 7 alerts (row 8-9, col various)
```

#### Step 4: Update Step (Iteration 1)

Recalculate centroid as the **mean** of all assigned alerts:

```
Cluster A centroid (before): (1, 0)
Cluster A alerts: (1,0), (0,1), (0,0), (1,1), (2,0), (2,1), (1,2)
Cluster A centroid (after) = (
    mean_lat = (1+0+0+1+2+2+1) / 7 = 7/7 = 1.0,
    mean_lng = (0+1+0+1+0+1+2) / 7 = 5/7 ≈ 0.71
)
New centroid A: (1.0, 0.71)

(This centroid has "moved" slightly to account for all member alerts)
```

Repeat for all 5 clusters.

#### Step 5: Convergence Check

```java
if (centroids_have_moved_significantly) {
    REPEAT Steps 3-4
} else {
    CONVERGED → Stop
}

Convergence criteria: centroid shift < 0.0001°
```

#### Step 6: Final Result

After convergence (typically 3-5 iterations):

```
Cluster 0:
  - Centroid: (1.2, 1.5)
  - Alerts: 7
  - Severity distribution: [0, 2, 3, 2, 0, 0]
  - Types: 3 Fire, 2 Medical, 2 Other
  - Severity indicator: MEDIUM (mostly 2-3)
  
Cluster 1:
  - Centroid: (1.1, 7.3)
  - Alerts: 3
  - Severity distribution: [0, 0, 1, 1, 1, 0]
  - Types: 2 Medical, 1 Fire
  - Severity indicator: MEDIUM-HIGH (3-4)
  
... (3 more clusters)
```

### Frontend Visualization

```javascript
// Map display for each cluster:
<Circle
  center={[centroidLat, centroidLng]}
  radius={alertCount * 500}  // Size by alert count
  fillColor={getSeverityColor(dominantSeverity)}
  onClick={() => showClusterDetails(clusterId)}
/>

Color mapping:
- Severity 1-2: Green (low impact)
- Severity 3: Yellow (medium)
- Severity 4: Orange (high)
- Severity 5: Red (critical)
```

**User Interaction:**
- Hover to see cluster tooltip: "5 alerts, avg severity 3.2"
- Click to zoom into cluster and show individual alerts
- Click individual alert to view details

### Code Example

```java
public void runClustering() {
    List<Alert> alerts = alertRepository.findByStatus(
        Alert.AlertStatus.ACTIVE, Pageable.unpaged()).getContent();
    
    if (alerts.isEmpty()) return;
    
    int k = Math.min(5, alerts.size());
    double[][] centroids = initializeCentroids(alerts, k);
    int[] assignments = new int[alerts.size()];
    
    // Run EM algorithm
    for (int iteration = 0; iteration < 100; iteration++) {
        // Assignment
        for (int i = 0; i < alerts.size(); i++) {
            double minDist = Double.MAX_VALUE;
            int bestCluster = 0;
            for (int c = 0; c < k; c++) {
                double dist = euclideanDistance(
                    alerts.get(i).getLatitude(), 
                    alerts.get(i).getLongitude(),
                    centroids[c][0], 
                    centroids[c][1]
                );
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = c;
                }
            }
            assignments[i] = bestCluster;
        }
        
        // Update
        double[][] newCentroids = new double[k][2];
        int[] counts = new int[k];
        
        for (int i = 0; i < alerts.size(); i++) {
            int cluster = assignments[i];
            newCentroids[cluster][0] += alerts.get(i).getLatitude();
            newCentroids[cluster][1] += alerts.get(i).getLongitude();
            counts[cluster]++;
        }
        
        // Average
        for (int c = 0; c < k; c++) {
            if (counts[c] > 0) {
                newCentroids[c][0] /= counts[c];
                newCentroids[c][1] /= counts[c];
            }
        }
        
        // Check convergence
        if (hasConverged(centroids, newCentroids)) {
            centroids = newCentroids;
            break;
        }
        
        centroids = newCentroids;
    }
    
    // Build and cache result
    cachedResult = buildClusterResults(alerts, assignments, centroids);
}
```

### Real-World Disaster Scenario

```
Scenario: Flooding in Mumbai

Hour 0: 5 alerts scattered across flood zone → 2 clusters
Hour 1: 15 more alerts arrive → K-Means re-runs → 3 clusters
Hour 2: 40 alerts total → 4 clusters showing epicenter concentration
Hour 3: 60 alerts total → 5 clusters, clear hotspot at (19.08, 72.88)

Admin view:
- Cluster at (19.08, 72.88): 25 alerts, avg severity 4.2 → RED ZONE
- Cluster at (19.15, 72.92): 18 alerts, avg severity 2.8 → YELLOW ZONE
- (Other 3 clusters less affected)

Resource allocation:
- Deploy rescue teams to RED ZONE immediately
- Medical stations to both RED and YELLOW zones
- Monitor other clusters for escalation
```

### Why This Helps ResQNet

1. **Real-time Situation Awareness:** Admins instantly see disaster concentrations
2. **Resource Optimization:** Send teams to cluster centroids (covers most alerts)
3. **Map Usability:** Prevents marker clutter, improves user experience
4. **Early Detection:** New cluster formation indicates spreading disaster
5. **Scalability:** Works with 5 alerts or 500 alerts efficiently

### Testing

Run `python testcases/demo_hotspots.py` to inject 12 tightly-clustered alerts in Delhi and observe K-Means form a hotspot.

---

## K-Nearest Neighbors - Duplicate Detection & Resource Matching

### Why KNN is Needed

K-Nearest Neighbors serves two critical functions in ResQNet:

**Use Case 1: Duplicate Alert Detection**
- During emergencies, the same incident gets reported multiple times
- 20 people see the same building fire and submit 20 separate alerts
- Without deduplication, map gets cluttered and vote scores get split
- KNN identifies these duplicates so users can upvote the original instead

**Use Case 2: Proximity Resource Matching**
- User searches for food/shelter/medical supplies
- Needs to find the **closest available resources** from potentially hundreds
- Brute force comparison is slow; KNN is optimized for nearest neighbor search
- Enables real-time "Find nearest shelter" functionality

### Implementation

**Location:**
- `backend/src/main/java/com/disasteralert/ml/service/KNNAlertService.java` (K=5 for alerts)
- `backend/src/main/java/com/disasteralert/ml/service/KNNResourceMatcherService.java` (K=3 for resources)

---

## KNN Algorithm 1: Similar Alert Detection

### Why Alert Similarity Matters

Scenario: Major fire breaks out in Mumbai. Within 10 minutes:
- User A: "Fire at Mumbai downtown, call 911!"
- User B: "Downtown building on fire, people evacuating"
- User C: "Smoke and flames seen downtown Mumbai area"
- User D: "Fire downtown burning fast" (different location, same area)

All are the same incident but separate alerts. Without KNN:
- 4 duplicate markers clutter the map
- Vote score fragmented: 10 upvotes split among 4 alerts instead of unified 40
- Users see multiple alerts for same incident, causing confusion

### Solution: KNN Finds Similar Alerts

### Features Used for Similarity

KNN compares 4 features (all normalized 0-1):

**Feature 1: Geographic Proximity (Latitude & Longitude)**
```
Normalized latitude & longitude (0-1 scale across all alerts)

If all alerts in database span from:
  lat: 19.00 to 28.00 (8° range)
  lng: 72.00 to 80.00 (8° range)

Then query alert at (19.10, 72.50) normalizes to:
  norm_lat = (19.10 - 19.00) / 8.00 = 0.0125
  norm_lng = (72.50 - 72.00) / 8.00 = 0.0625

Database alert at (19.12, 72.52) normalizes to:
  norm_lat = (19.12 - 19.00) / 8.00 = 0.015
  norm_lng = (72.52 - 72.00) / 8.00 = 0.065

Distance in feature space = √[(0.0125-0.015)² + (0.0625-0.065)²] ≈ 0.00354
(Very close geographically → Low distance)
```

**Feature 2: Severity**
```
Normalized severity (0-1 scale)

If severities in database range from 1 to 5:
  min_sev = 1, max_sev = 5 (range = 4)

Alert with severity 4 normalizes to:
  norm_sev = (4 - 1) / 4 = 0.75

Alert with severity 5 normalizes to:
  norm_sev = (5 - 1) / 4 = 1.0

Distance = |0.75 - 1.0| = 0.25
(1 severity level difference in feature space)
```

**Feature 3: Alert Type**
```
Encoded and normalized:
  Fire: 1, Flood: 2, Medical: 3, Power: 4, Other: 5
  
Normalized: (type - 1) / 4

Alert Type Fire (1):
  norm_type = (1 - 1) / 4 = 0.0

Alert Type Medical (3):
  norm_type = (3 - 1) / 4 = 0.5

Distance = 0.5
(Different type categories, moderate distance)
```

### Feature Normalization (Critical for KNN)

```java
public List<SimilarAlertDTO> findSimilarAlerts(double lat, double lng,
                                                String alertTypeName, int severity) {
    List<Alert> allAlerts = alertRepository.findAll();
    
    // Step 1: Find min/max for normalization
    double minLat = Double.MAX_VALUE, maxLat = -Double.MAX_VALUE;
    // ... (similar for lng, severity, type)
    
    for (Alert a : allAlerts) {
        minLat = Math.min(minLat, a.getLatitude());
        maxLat = Math.max(maxLat, a.getLatitude());
        // ... etc
    }
    
    // Step 2: Normalize query
    double normQueryLat = (lat - minLat) / (maxLat - minLat);
    double normQueryLng = (lng - minLng) / (maxLng - minLng);
    
    // Step 3: Compute distance for each database alert
    List<AlertDistance> distances = new ArrayList<>();
    for (Alert a : allAlerts) {
        double normAlertLat = (a.getLatitude() - minLat) / (maxLat - minLat);
        double normAlertLng = (a.getLongitude() - minLng) / (maxLng - minLng);
        
        // Euclidean distance in 4D feature space
        double distance = Math.sqrt(
            Math.pow(normQueryLat - normAlertLat, 2) +
            Math.pow(normQueryLng - normAlertLng, 2) +
            Math.pow(normQuerySev - normAlertSev, 2) +
            Math.pow(normQueryType - normAlertType, 2)
        );
        
        distances.add(new AlertDistance(a, distance));
    }
    
    // Step 4: Sort and return top K=5
    return distances.stream()
        .sorted(Comparator.comparingDouble(d -> d.distance))
        .limit(5)
        .map(d -> new SimilarAlertDTO(d.alert))
        .collect(Collectors.toList());
}
```

### Real-World Example: Finding Similar Fire Alerts

```
Database State: 15 active alerts
Alert ID 1: Fire, (19.10, 72.50), severity 4, reported 10 min ago
Alert ID 2: Flood, (19.20, 72.60), severity 3, reported 8 min ago
Alert ID 3: Fire, (19.11, 72.51), severity 4, reported 3 min ago ← DUPLICATE
Alert ID 4: Medical, (28.60, 77.20), severity 3, reported 5 min ago
Alert ID 5: Fire, (19.15, 72.55), severity 3, reported 2 min ago ← SIMILAR
... (10 more alerts)

Query: New alert "Fire downtown" at (19.10, 72.50), severity 5, type Fire

Normalization (lat range 19-28, lng range 72-80, sev 1-5, type 1-5):
  norm_query = [0.1111, 0.0625, 1.0, 0.0]

Distance calculations:
Alert 1: distance = √[(0-0)² + (0-0)² + (0.75-1.0)² + (0-0)²] = 0.25 ← CLOSEST
Alert 3: distance = √[(0.0011)² + (0.0013)² + (0.75-1.0)² + (0-0)²] = 0.25 ← DUPLICATE
Alert 5: distance = √[(0.0055)² + (0.0063)² + (0.5-1.0)² + (0-0)²] = 0.501

Top 5 similar alerts: [Alert 1, Alert 3, Alert 5, ...]

API Response:
[
  {
    "id": 1,
    "title": "Fire at Mumbai downtown",
    "severity": 4,
    "distance": 0.25
  },
  {
    "id": 3,
    "title": "Downtown building burning",
    "severity": 4,
    "distance": 0.25  ← Same distance, clearly duplicate
  },
  {
    "id": 5,
    "title": "Fire spreading near downtown",
    "severity": 3,
    "distance": 0.501  ← Nearby, slightly different severity
  },
  ...
]
```

### API Endpoint

```
GET /ml/knn/similar-alerts?lat=19.10&lng=72.50&type=Fire&severity=5

Response: [
  {
    "id": 1,
    "title": "Fire at Mumbai downtown",
    "description": "...",
    "alertType": "Fire",
    "severity": 4,
    "latitude": 19.10,
    "longitude": 72.50,
    "distance": 0.25,  // In normalized feature space
    "created": "2024-01-15T14:32:00Z"
  },
  ...
]
```

### Frontend Usage Example

```javascript
// User creates new alert
async function createAlert(formData) {
    const response = await api.createAlert(formData);
    const alertId = response.data.id;
    
    // Check for duplicates
    const similar = await api.get(
        `/ml/knn/similar-alerts?lat=${formData.lat}&lng=${formData.lng}&type=${formData.type}&severity=${formData.severity}`
    );
    
    if (similar.data.length > 0 && similar.data[0].distance < 0.3) {
        // Show duplicate warning
        showWarning("Similar alert already exists", {
            title: similar.data[0].title,
            distance: similar.data[0].distance,
            action: "Would you like to upvote instead?"
        });
    }
}
```

---

## KNN Algorithm 2: Nearest Resource Matching

### Why Resource Proximity Matters

Scenario: Building collapses, 50+ people need medical help. Someone searches: "Medical supplies nearby"

Without KNN:
- Would need to iterate through all 500+ resources in database
- Linear search through all, calculate distance for all
- Slow, especially on mobile during emergency

With KNN + Haversine Distance:
- Optimized distance metric accounting for Earth's curvature
- Find 3 nearest medical supplies in milliseconds
- User gets real-time response

### Haversine Distance Formula

Unlike Euclidean distance (straight line), Haversine accounts for Earth's curvature:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × asin(√a)
distance_km = R × c   (R = Earth radius = 6371 km)

Why this matters:
- At equator, 1° ≈ 111 km
- At poles, 1° ≈ 0 km (lines converge)
- Haversine accounts for this curvature
- Euclidean would give wrong distances
```

### Example Calculation

```
User location: (19.0760°N, 72.8777°E) - Mumbai
Medical Resource A: (19.0800°N, 72.8810°E) - 0.6km away
Medical Resource B: (19.1500°N, 73.0000°E) - 12km away

Haversine calculation:
dLat = (19.08 - 19.076) × π/180 = 0.000698 radians
dLng = (72.881 - 72.878) × π/180 = 0.000523 radians

a = sin²(0.000698/2) + cos(19.076°) × cos(19.08°) × sin²(0.000523/2)
  = 0.0000000121 + 0.9425 × 0.9425 × 0.0000000068
  = 0.0000000121

c = 2 × asin(√0.0000000121) = 0.0000219 radians
distance = 6371 × 0.0000219 ≈ 0.14 km (140 meters) ✓ Accurate

(Using Euclidean: √[0.004² + 0.003²] ≈ 0.005° ≈ 0.56km ✗ Wrong)
```

### Implementation

```java
public List<NearestResourceDTO> findNearestResources(double lat, double lng) {
    List<Resource> allResources = resourceRepository.findAll();
    
    // Filter: status == AVAILABLE AND has valid location
    List<Resource> available = allResources.stream()
        .filter(r -> r.getStatus() == Resource.ResourceStatus.AVAILABLE)
        .filter(r -> r.getLatitude() != null && r.getLongitude() != null)
        .collect(Collectors.toList());
    
    // Compute Haversine distance for each
    List<ResourceDistance> distances = new ArrayList<>();
    for (Resource r : available) {
        double dist = haversine(lat, lng, r.getLatitude(), r.getLongitude());
        distances.add(new ResourceDistance(r, dist));
    }
    
    // Return top K=3
    return distances.stream()
        .sorted(Comparator.comparingDouble(rd -> rd.distanceKm))
        .limit(3)
        .map(rd -> {
            NearestResourceDTO dto = new NearestResourceDTO();
            dto.setId(rd.resource.getId());
            dto.setTitle(rd.resource.getTitle());
            dto.setResourceType(rd.resource.getResourceType().getName());
            dto.setDistanceKm(rd.distanceKm);
            dto.setContactInfo(rd.resource.getContactInfo());
            // ... other fields
            return dto;
        })
        .collect(Collectors.toList());
}

private double haversine(double lat1, double lng1, double lat2, double lng2) {
    double dLat = Math.toRadians(lat2 - lat1);
    double dLng = Math.toRadians(lng2 - lng1);
    
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) 
        * Math.cos(Math.toRadians(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
```

### API Endpoint

```
GET /ml/knn/nearest-resources?lat=19.076&lng=72.878

Response: [
  {
    "id": 45,
    "title": "Mobile Medical Unit - Mumbai Central",
    "resourceType": "Medical",
    "status": "AVAILABLE",
    "contactInfo": "+91-9876543210",
    "latitude": 19.0800,
    "longitude": 72.8810,
    "distanceKm": 0.14  ← 140 meters away
  },
  {
    "id": 78,
    "title": "Hospital - West Mumbai",
    "resourceType": "Medical",
    "status": "AVAILABLE",
    "contactInfo": "192",
    "latitude": 19.1200,
    "longitude": 72.9500,
    "distanceKm": 2.34  ← 2.34 km away
  },
  {
    "id": 102,
    "title": "Clinic - Bandra",
    "resourceType": "Medical",
    "status": "AVAILABLE",
    "contactInfo": "+91-9876543211",
    "latitude": 19.0596,
    "longitude": 72.8295,
    "distanceKm": 4.78  ← 4.78 km away
  }
]
```

### Frontend Usage

```javascript
// User searches for nearby medical resources
async function findNearestResources() {
    const position = await getGeolocation();  // User's current GPS
    
    const response = await api.get(
        `/ml/knn/nearest-resources?lat=${position.lat}&lng=${position.lng}`
    );
    
    // Display top 3 resources with distance
    response.data.forEach(resource => {
        showResourceCard({
            title: resource.title,
            type: resource.resourceType,
            distance: `${resource.distanceKm.toFixed(2)} km`,
            contact: resource.contactInfo,
            onclick: () => openMaps(resource.latitude, resource.longitude)
        });
    });
}
```

### Real-World Disaster Response

```
Scenario: Medical emergency after building collapse

1. First responder on scene at (19.1050, 72.8850)
2. Calls emergency API: GET /ml/knn/nearest-resources?lat=19.1050&lng=72.8850
3. KNN instantly returns:
   - Red Cross Station (0.8 km)
   - City Hospital (1.2 km)
   - Private Clinic (2.5 km)
4. First responder contacts nearest in 30 seconds
5. Ambulances dispatched immediately

Without KNN: Would have to search database manually or call 100 numbers.
With KNN: Find 3 nearest in <100ms, pick best, coordinate response.
```

### Why This Helps ResQNet

1. **Emergency Response Speed:** Real-time nearest resource discovery
2. **Resource Optimization:** Users find closest option, reduce travel time
3. **Mobile-Friendly:** Fast queries work on slow connections during emergencies
4. **Accurate Distance:** Haversine accounts for Earth's curvature (critical for large areas)
5. **Scalability:** Efficient even with thousands of resources

### Testing

Run `python testcases/demo_knn_resources.py` to create resources and test nearest matching functionality.

---

## Summary Table

| Algorithm | Location | Purpose | Input | Output | K Value |
|-----------|----------|---------|-------|--------|---------|
| **Naive Bayes** | NaiveBayesCredibilityService | Classify alert credibility | Description, post count, hour | CREDIBLE/SUSPICIOUS/SPAM + confidence | 3 classes |
| **Decision Trees** | DecisionTreeSeverityService | Predict severity (1-5) | Alert type, keywords, location, nearby count | Severity level + escalation flag | 5 levels |
| **K-Means** | KMeansClusteringService | Find disaster hotspots | Alert locations | Cluster centroids + member alerts | 5 clusters |
| **KNN Alerts** | KNNAlertService | Find similar/duplicate alerts | Query alert (lat, lng, type, severity) | 5 most similar alerts with distances | K=5 |
| **KNN Resources** | KNNResourceMatcherService | Find nearest resources | User location | 3 nearest available resources with distances | K=3 |

---

## Conclusion

ResQNet's ML pipeline transforms raw crowdsourced reports into **intelligent, actionable disaster intelligence**:

1. **Naive Bayes** filters out noise (SPAM/SUSPICIOUS)
2. **Decision Trees** objectively assess severity and escalate critical incidents
3. **K-Means** groups reports into geographic hotspots for situational awareness
4. **KNN (Alerts)** detects duplicates, consolidating fragmented information
5. **KNN (Resources)** enables real-time emergency resource discovery

Together, these algorithms enable fast, informed decision-making during high-stress disaster situations.
