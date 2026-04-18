package com.disasteralert.ml.dto;

import lombok.Data;

@Data
public class SeverityPredictionDTO {
    private int predictedSeverity;
    private boolean shouldEscalate;
    private int keywordScore;
    private int nearbyCount;
}
