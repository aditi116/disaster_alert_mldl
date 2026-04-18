package com.disasteralert.service;

import com.disasteralert.dto.AlertRequest;
import com.disasteralert.dto.AlertResponse;
import com.disasteralert.entity.Alert;
import com.disasteralert.entity.AlertType;
import com.disasteralert.entity.User;
import com.disasteralert.repository.AlertRepository;
import com.disasteralert.repository.AlertTypeRepository;
import com.disasteralert.repository.UserRepository;
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

    private final AlertRepository alertRepository;
    private final AlertTypeRepository alertTypeRepository;
    private final UserRepository userRepository;

    public AlertService(AlertRepository alertRepository,
                       AlertTypeRepository alertTypeRepository,
                       UserRepository userRepository) {
        this.alertRepository = alertRepository;
        this.alertTypeRepository = alertTypeRepository;
        this.userRepository = userRepository;
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
