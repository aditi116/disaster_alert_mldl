package com.disasteralert.ml.controller;

import com.disasteralert.dto.MessageResponse;
import com.disasteralert.ml.dto.ReputationEventRequest;
import com.disasteralert.ml.dto.ReputationSummaryDTO;
import com.disasteralert.ml.model.ReputationEventType;
import com.disasteralert.ml.service.ReputationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/ml/reputation")
public class ReputationController {

    @Autowired
    private ReputationService reputationService;

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getReputation(@PathVariable Long id) {
        ReputationSummaryDTO summary = reputationService.getReputation(id);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/users/{id}/event")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> applyEvent(@PathVariable Long id,
                                        @RequestBody ReputationEventRequest request) {
        ReputationEventType eventType = ReputationEventType.valueOf(request.getEventType());
        reputationService.applyEvent(id, eventType, request.getAlertId());
        return ResponseEntity.ok(new MessageResponse("Reputation event applied successfully"));
    }
}
