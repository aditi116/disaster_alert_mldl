package com.disasteralert.ml.dto;

import lombok.Data;

import java.util.List;

@Data
public class ClusterResultDTO {
    private int clusterId;
    private Double centroidLat;
    private Double centroidLng;
    private int alertCount;
    private String dominantAlertType;
    private List<Long> alertIds;
}
