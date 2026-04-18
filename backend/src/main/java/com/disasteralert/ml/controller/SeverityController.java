package com.disasteralert.ml.controller;

import com.disasteralert.ml.dto.SeverityPredictionDTO;
import com.disasteralert.ml.service.DecisionTreeEscalationService;
import com.disasteralert.ml.service.DecisionTreeSeverityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/ml/alerts")
public class SeverityController {

    @Autowired
    private DecisionTreeSeverityService decisionTreeSeverityService;

    @Autowired
    private DecisionTreeEscalationService decisionTreeEscalationService;

    @GetMapping("/predict-severity")
    public ResponseEntity<?> predictSeverity(
            @RequestParam String type,
            @RequestParam String description,
            @RequestParam double lat,
            @RequestParam double lng) {

        int predictedSeverity = decisionTreeSeverityService.predictSeverity(type, description, lat, lng);
        boolean shouldEscalate = decisionTreeEscalationService.shouldEscalate(
                type, description, lat, lng, predictedSeverity);
        int keywordScore = decisionTreeSeverityService.computeKeywordScore(description);
        int nearbyCount = decisionTreeSeverityService.computeNearbyCount(lat, lng);

        SeverityPredictionDTO dto = new SeverityPredictionDTO();
        dto.setPredictedSeverity(predictedSeverity);
        dto.setShouldEscalate(shouldEscalate);
        dto.setKeywordScore(keywordScore);
        dto.setNearbyCount(nearbyCount);

        return ResponseEntity.ok(dto);
    }
}
