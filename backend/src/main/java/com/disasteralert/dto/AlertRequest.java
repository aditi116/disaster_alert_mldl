package com.disasteralert.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AlertRequest {
    @NotBlank
    @Size(max = 100)
    private String title;

    private String description;

    @NotNull
    private Integer alertTypeId;

    @NotNull
    @Min(1)
    @Max(5)
    private Integer severity;

    @NotNull
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    @NotNull
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;
}
