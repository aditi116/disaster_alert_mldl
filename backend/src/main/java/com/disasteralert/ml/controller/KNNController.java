package com.disasteralert.ml.controller;

import com.disasteralert.ml.dto.NearestResourceDTO;
import com.disasteralert.ml.dto.SimilarAlertDTO;
import com.disasteralert.ml.service.KNNAlertService;
import com.disasteralert.ml.service.KNNResourceMatcherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/ml/knn")
public class KNNController {

    @Autowired
    private KNNAlertService knnAlertService;

    @Autowired
    private KNNResourceMatcherService knnResourceMatcherService;

    @GetMapping("/similar-alerts")
    public ResponseEntity<?> getSimilarAlerts(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam String type,
            @RequestParam int severity) {
        List<SimilarAlertDTO> results = knnAlertService.findSimilarAlerts(lat, lng, type, severity);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/nearest-resources")
    public ResponseEntity<?> getNearestResources(
            @RequestParam double lat,
            @RequestParam double lng) {
        List<NearestResourceDTO> results = knnResourceMatcherService.findNearestResources(lat, lng);
        return ResponseEntity.ok(results);
    }
}
