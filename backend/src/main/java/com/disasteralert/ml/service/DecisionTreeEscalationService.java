package com.disasteralert.ml.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DecisionTreeEscalationService {

    @Autowired
    private DecisionTreeSeverityService decisionTreeSeverityService;

    public boolean shouldEscalate(String typeName, String description,
                                  double lat, double lng, int predictedSeverity) {
        int encodedType = decisionTreeSeverityService.encodeType(typeName);
        int keywordScore = decisionTreeSeverityService.computeKeywordScore(description);
        int nearbyCount = decisionTreeSeverityService.computeNearbyCount(lat, lng);

        return predictedSeverity >= 4
                || keywordScore >= 3
                || nearbyCount >= 5
                || (encodedType == 1 && keywordScore >= 2);
    }
}
