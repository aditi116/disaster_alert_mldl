package com.disasteralert.ml.dto;

import lombok.Data;

import java.util.List;

@Data
public class ReputationSummaryDTO {
    private Long userId;
    private String username;
    private Integer reputationScore;
    private List<ReputationEventDTO> events;
}
