package com.disasteralert.ml.controller;

import com.disasteralert.entity.Alert;
import com.disasteralert.exception.ResourceNotFoundException;
import com.disasteralert.ml.dto.CredibilityResultDTO;
import com.disasteralert.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/ml/alerts")
public class CredibilityController {

    @Autowired
    private AlertRepository alertRepository;

    @GetMapping("/{id}/credibility")
    public ResponseEntity<CredibilityResultDTO> getCredibility(@PathVariable Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));

        CredibilityResultDTO result = new CredibilityResultDTO();
        result.setAlertId(alert.getId());
        result.setLabel(alert.getCredibilityLabel());
        result.setConfidence(alert.getCredibilityConfidence());

        return ResponseEntity.ok(result);
    }
}
