package com.disasteralert.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ResourceRequest {
    @NotBlank
    @Size(max = 100)
    private String title;

    private String description;

    @NotNull
    private Integer resourceTypeId;

    @NotBlank
    private String status; // AVAILABLE, REQUESTED, RESERVED, FULFILLED

    private Long alertId;

    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    @Size(max = 255)
    private String contactInfo;
}
