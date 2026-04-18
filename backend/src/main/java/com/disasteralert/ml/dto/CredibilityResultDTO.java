package com.disasteralert.ml.dto;

import lombok.Data;

@Data
public class CredibilityResultDTO {
    private Long alertId;
    private String label;
    private Float confidence;
}
