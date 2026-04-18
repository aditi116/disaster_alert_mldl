package com.disasteralert.dto;

import com.disasteralert.entity.Resource;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ResourceResponse {
    private Long id;
    private String title;
    private String description;
    private String resourceType;
    private String status;
    private Long userId;
    private String username;
    private Long alertId;
    private Double latitude;
    private Double longitude;
    private String contactInfo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ResourceResponse fromEntity(Resource resource) {
        ResourceResponse response = new ResourceResponse();
        response.setId(resource.getId());
        response.setTitle(resource.getTitle());
        response.setDescription(resource.getDescription());
        response.setResourceType(resource.getResourceType().getName());
        response.setStatus(resource.getStatus().name());
        response.setUserId(resource.getUser().getId());
        response.setUsername(resource.getUser().getUsername());
        response.setAlertId(resource.getAlert() != null ? resource.getAlert().getId() : null);
        response.setLatitude(resource.getLatitude());
        response.setLongitude(resource.getLongitude());
        response.setContactInfo(resource.getContactInfo());
        response.setCreatedAt(resource.getCreatedAt());
        response.setUpdatedAt(resource.getUpdatedAt());
        return response;
    }
}
