package com.disasteralert.ml.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ReputationEventDTO {
    private Long id;
    private String eventType;
    private Integer points;
    private Long alertId;
    private LocalDateTime createdAt;
}
