package com.disasteralert.dto;

import com.disasteralert.entity.Alert;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AlertResponse {
    private Long id;
    private String title;
    private String description;
    private String alertType;
    private Integer severity;
    private Double latitude;
    private Double longitude;
    private String status;
    private Integer reliabilityScore;
    private Long userId;
    private String username;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AlertResponse fromEntity(Alert alert) {
        AlertResponse response = new AlertResponse();
        response.setId(alert.getId());
        response.setTitle(alert.getTitle());
        response.setDescription(alert.getDescription());
        response.setAlertType(alert.getAlertType().getName());
        response.setSeverity(alert.getSeverity());
        response.setLatitude(alert.getLatitude());
        response.setLongitude(alert.getLongitude());
        response.setStatus(alert.getStatus().name());
        response.setReliabilityScore(alert.getReliabilityScore());
        response.setUserId(alert.getUser().getId());
        response.setUsername(alert.getUser().getUsername());
        response.setCreatedAt(alert.getCreatedAt());
        response.setUpdatedAt(alert.getUpdatedAt());
        return response;
    }
}
