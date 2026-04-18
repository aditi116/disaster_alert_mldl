package com.disasteralert.controller;

import com.disasteralert.dto.AlertRequest;
import com.disasteralert.dto.AlertResponse;
import com.disasteralert.dto.MessageResponse;
import com.disasteralert.dto.VoteRequest;
import com.disasteralert.entity.Alert;
import com.disasteralert.service.AlertService;
import com.disasteralert.service.VoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/alerts")
public class AlertController {

    private final AlertService alertService;
    private final VoteService voteService;

    public AlertController(AlertService alertService, VoteService voteService) {
        this.alertService = alertService;
        this.voteService = voteService;
    }

    @PostMapping
    public ResponseEntity<AlertResponse> createAlert(@Valid @RequestBody AlertRequest request,
                                                     Authentication authentication) {
        AlertResponse response = alertService.createAlert(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertResponse> getAlert(@PathVariable Long id) {
        AlertResponse response = alertService.getAlertById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAllAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(required = false) Double minLng,
            @RequestParam(required = false) Double maxLng) {

        List<AlertResponse> alerts;

        // If lat, lng, and radius are provided, search nearby
        if (lat != null && lng != null && radius != null) {
            alerts = alertService.getAlertsNearby(lat, lng, radius, page, size);
        }
        // If bounding box coordinates are provided
        else if (minLat != null && maxLat != null && minLng != null && maxLng != null) {
            alerts = alertService.getAlertsWithinBounds(minLat, maxLat, minLng, maxLng, page, size);
        }
        // Otherwise, return all alerts
        else {
            alerts = alertService.getAllAlerts(page, size);
        }

        return ResponseEntity.ok(alerts);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AlertResponse> updateAlertStatus(@PathVariable Long id,
                                                           @RequestParam String status,
                                                           Authentication authentication) {
        Alert.AlertStatus alertStatus = Alert.AlertStatus.valueOf(status.toUpperCase());
        AlertResponse response = alertService.updateAlertStatus(id, alertStatus, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteAlert(@PathVariable Long id,
                                                       Authentication authentication) {
        alertService.deleteAlert(id, authentication.getName());
        return ResponseEntity.ok(new MessageResponse("Alert deleted successfully"));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<MessageResponse> voteOnAlert(@PathVariable Long id,
                                                       @Valid @RequestBody VoteRequest request,
                                                       Authentication authentication) {
        voteService.voteOnAlert(id, request.getIsUpvote(), authentication.getName());
        return ResponseEntity.ok(new MessageResponse("Vote recorded successfully"));
    }

    @GetMapping("/{id}/votes")
    public ResponseEntity<?> getVoteStats(@PathVariable Long id, Authentication authentication) {
        long upvotes = voteService.getUpvoteCount(id);
        long downvotes = voteService.getDownvoteCount(id);
        Boolean userVote = authentication != null ? voteService.getUserVote(id, authentication.getName()) : null;
        
        return ResponseEntity.ok(new VoteStats(upvotes, downvotes, userVote));
    }

    // Inner class for vote statistics
    private static class VoteStats {
        public long upvotes;
        public long downvotes;
        public Boolean userVote;

        public VoteStats(long upvotes, long downvotes, Boolean userVote) {
            this.upvotes = upvotes;
            this.downvotes = downvotes;
            this.userVote = userVote;
        }
    }
}
