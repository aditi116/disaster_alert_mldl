package com.disasteralert.controller;

import com.disasteralert.dto.MessageResponse;
import com.disasteralert.dto.ResourceRequest;
import com.disasteralert.dto.ResourceResponse;
import com.disasteralert.entity.Resource;
import com.disasteralert.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @PostMapping
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody ResourceRequest request,
                                                           Authentication authentication) {
        ResourceResponse response = resourceService.createResource(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getResource(@PathVariable Long id) {
        ResourceResponse response = resourceService.getResourceById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ResourceResponse>> getAllResources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radius,
            @RequestParam(required = false) Long alertId) {

        List<ResourceResponse> resources;

        // If alertId is provided, get resources for that alert
        if (alertId != null) {
            resources = resourceService.getResourcesByAlert(alertId, page, size);
        }
        // If lat, lng, and radius are provided, search nearby
        else if (lat != null && lng != null && radius != null) {
            resources = resourceService.getResourcesNearby(lat, lng, radius, page, size);
        }
        // If status is provided, filter by status
        else if (status != null) {
            Resource.ResourceStatus resourceStatus = Resource.ResourceStatus.valueOf(status.toUpperCase());
            resources = resourceService.getResourcesByStatus(resourceStatus, page, size);
        }
        // Otherwise, return all resources
        else {
            resources = resourceService.getAllResources(page, size);
        }

        return ResponseEntity.ok(resources);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ResourceResponse> updateResourceStatus(@PathVariable Long id,
                                                                 @RequestParam String status,
                                                                 Authentication authentication) {
        Resource.ResourceStatus resourceStatus = Resource.ResourceStatus.valueOf(status.toUpperCase());
        ResourceResponse response = resourceService.updateResourceStatus(id, resourceStatus, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteResource(@PathVariable Long id,
                                                          Authentication authentication) {
        resourceService.deleteResource(id, authentication.getName());
        return ResponseEntity.ok(new MessageResponse("Resource deleted successfully"));
    }
}
