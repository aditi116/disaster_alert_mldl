package com.disasteralert.ml.service;

import com.disasteralert.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DecisionTreeSeverityService {

    @Autowired
    private AlertRepository alertRepository;

    private static final Map<String, Integer> TYPE_ENCODING = Map.of(
            "Fire", 1,
            "Flood", 2,
            "Medical Emergency", 3,
            "Power Outage", 4,
            "Other", 5
    );

    private static final List<String> KEYWORDS = List.of(
            "fire", "trapped", "urgent", "help", "critical", "emergency", "danger", "flood",
            "collapse", "explosion", "evacuate", "rescue", "casualt", "injur", "dead"
    );

    // Major Indian city coordinates for urban detection
    private static final double[][] URBAN_COORDS = {
            {19.07, 72.87},   // Mumbai
            {28.67, 77.21},   // Delhi
            {12.97, 77.59},   // Bangalore
            {13.08, 80.27},   // Chennai
            {22.57, 88.36},   // Kolkata
            {17.38, 78.47},   // Hyderabad
            {18.52, 73.85},   // Pune
            {23.02, 72.57}    // Ahmedabad
    };

    public int predictSeverity(String alertTypeName, String description, double lat, double lng) {
        int encodedType = encodeType(alertTypeName);
        int keywordScore = computeKeywordScore(description);
        boolean isUrban = checkIsUrban(lat, lng);
        int nearbyCount = computeNearbyCount(lat, lng);

        // Decision tree rules
        if (keywordScore >= 5) {
            return 5;
        }
        if (keywordScore >= 3) {
            return (encodedType == 1 || encodedType == 3) ? 5 : 4;
        }
        if (keywordScore >= 2) {
            if (isUrban && nearbyCount >= 3) {
                return 4;
            }
            return (encodedType == 1 || encodedType == 2) ? 3 : 3;
        }
        if (keywordScore == 1) {
            return isUrban ? 3 : 2;
        }
        // keywordScore == 0
        return encodedType == 4 ? 2 : 1;
    }

    public int encodeType(String alertTypeName) {
        if (alertTypeName == null) return 0;
        return TYPE_ENCODING.getOrDefault(alertTypeName, 0);
    }

    public int computeKeywordScore(String description) {
        if (description == null || description.isBlank()) return 0;
        String lower = description.toLowerCase();
        int score = 0;
        for (String keyword : KEYWORDS) {
            if (lower.contains(keyword)) {
                score++;
            }
        }
        return score;
    }

    public boolean checkIsUrban(double lat, double lng) {
        for (double[] coord : URBAN_COORDS) {
            if (Math.abs(lat - coord[0]) <= 1.0 && Math.abs(lng - coord[1]) <= 1.0) {
                return true;
            }
        }
        return false;
    }

    public int computeNearbyCount(double lat, double lng) {
        return alertRepository.findNearbyAlerts(lat, lng, 5000, Pageable.ofSize(50)).size();
    }
}
