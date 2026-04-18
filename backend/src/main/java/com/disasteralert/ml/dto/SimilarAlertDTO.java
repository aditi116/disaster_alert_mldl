package com.disasteralert.ml.dto;

import lombok.Data;

@Data
public class SimilarAlertDTO {
    private Long id;
    private String title;
    private String alertType;
    private Integer severity;
    private Double latitude;
    private Double longitude;
    private String status;
    private Integer reliabilityScore;
    private Double distanceScore;
}
