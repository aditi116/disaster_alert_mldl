package com.disasteralert.service;

import com.disasteralert.dto.AlertRequest;
import com.disasteralert.dto.AlertResponse;
import com.disasteralert.entity.Alert;
import com.disasteralert.entity.AlertType;
import com.disasteralert.entity.User;
import com.disasteralert.ml.dto.CredibilityResultDTO;
import com.disasteralert.ml.service.DecisionTreeEscalationService;
import com.disasteralert.ml.service.DecisionTreeSeverityService;
import com.disasteralert.ml.service.NaiveBayesCredibilityService;
import com.disasteralert.repository.AlertRepository;
import com.disasteralert.repository.AlertTypeRepository;
import com.disasteralert.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final AlertTypeRepository alertTypeRepository;
    private final UserRepository userRepository;
    private final NaiveBayesCredibilityService naiveBayesCredibilityService;
    private final DecisionTreeSeverityService decisionTreeSeverityService;
    private final DecisionTreeEscalationService decisionTreeEscalationService;

    public AlertService(AlertRepository alertRepository,
                       AlertTypeRepository alertTypeRepository,
                       UserRepository userRepository,
                       NaiveBayesCredibilityService naiveBayesCredibilityService,
                       DecisionTreeSeverityService decisionTreeSeverityService,
                       DecisionTreeEscalationService decisionTreeEscalationService) {
        this.alertRepository = alertRepository;
        this.alertTypeRepository = alertTypeRepository;
        this.userRepository = userRepository;
        this.naiveBayesCredibilityService = naiveBayesCredibilityService;
        this.decisionTreeSeverityService = decisionTreeSeverityService;
        this.decisionTreeEscalationService = decisionTreeEscalationService;
    }

    @Transactional
    public AlertResponse createAlert(AlertRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        AlertType alertType = alertTypeRepository.findById(request.getAlertTypeId())
                .orElseThrow(() -> new RuntimeException("Alert type not found"));

        Alert alert = new Alert();
        alert.setTitle(request.getTitle());
        alert.setDescription(request.getDescription());
        alert.setAlertType(alertType);
        alert.setSeverity(request.getSeverity());
        alert.setLatitude(request.getLatitude());
        alert.setLongitude(request.getLongitude());
        alert.setUser(user);
        alert.setStatus(Alert.AlertStatus.ACTIVE);
        alert.setReliabilityScore(0);

        Alert savedAlert = alertRepository.save(alert);

        // Classify credibility using Naive Bayes
        CredibilityResultDTO credibilityResult = naiveBayesCredibilityService.classify(savedAlert);
        savedAlert.setCredibilityLabel(credibilityResult.getLabel());
        savedAlert.setCredibilityConfidence(credibilityResult.getConfidence());

        if ("SPAM".equals(credibilityResult.getLabel())) {
            log.warn("Alert {} flagged as SPAM for admin review", savedAlert.getId());
        }

        // Predict severity using Decision Tree
        int predictedSeverity = decisionTreeSeverityService.predictSeverity(
                alertType.getName(), request.getDescription(),
                request.getLatitude(), request.getLongitude());
        savedAlert.setPredictedSeverity(predictedSeverity);

        // Check escalation
        boolean escalate = decisionTreeEscalationService.shouldEscalate(
                alertType.getName(), request.getDescription(),
                request.getLatitude(), request.getLongitude(), predictedSeverity);
        if (escalate) {
            log.warn("Alert {} auto-escalated, predictedSeverity={}", savedAlert.getId(), predictedSeverity);
        }

        savedAlert = alertRepository.save(savedAlert);
        return AlertResponse.fromEntity(savedAlert);
    }

    @Transactional(readOnly = true)
    public AlertResponse getAlertById(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + id));
        return AlertResponse.fromEntity(alert);
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getAllAlerts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Alert> alertPage = alertRepository.findAll(pageable);
        return alertPage.getContent().stream()
                .map(AlertResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getAlertsNearby(double lat, double lng, double radius, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<Alert> alerts = alertRepository.findNearbyAlerts(lat, lng, radius, pageable);
        return alerts.stream()
                .map(AlertResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> getAlertsWithinBounds(double minLat, double maxLat, 
                                                     double minLng, double maxLng,
                                                     int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<Alert> alerts = alertRepository.findWithinBoundingBox(minLat, maxLat, minLng, maxLng, pageable);
        return alerts.stream()
                .map(AlertResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertResponse updateAlertStatus(Long id, Alert.AlertStatus status, String username) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + id));

        // Only the creator or admin can update status
        if (!alert.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to update this alert");
        }

        alert.setStatus(status);
        Alert updatedAlert = alertRepository.save(alert);
        return AlertResponse.fromEntity(updatedAlert);
    }

    @Transactional
    public void deleteAlert(Long id, String username) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found with id: " + id));

        // Only the creator can delete
        if (!alert.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this alert");
        }

        alertRepository.delete(alert);
    }

    @Transactional
    public void updateReliabilityScore(Long alertId, int scoreDelta) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setReliabilityScore(alert.getReliabilityScore() + scoreDelta);
        alertRepository.save(alert);
    }
}
