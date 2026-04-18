package com.disasteralert.ml.dto;

import lombok.Data;

@Data
public class ReputationEventRequest {
    private String eventType;
    private Long alertId;
}
