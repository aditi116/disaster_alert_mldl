package com.disasteralert.ml.dto;

import lombok.Data;

@Data
public class NearestResourceDTO {
    private Long id;
    private String title;
    private String resourceType;
    private String status;
    private String contactInfo;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;
}
