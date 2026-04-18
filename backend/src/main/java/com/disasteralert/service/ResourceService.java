package com.disasteralert.service;

import com.disasteralert.dto.ResourceRequest;
import com.disasteralert.dto.ResourceResponse;
import com.disasteralert.entity.Alert;
import com.disasteralert.entity.Resource;
import com.disasteralert.entity.ResourceType;
import com.disasteralert.entity.User;
import com.disasteralert.repository.AlertRepository;
import com.disasteralert.repository.ResourceRepository;
import com.disasteralert.repository.ResourceTypeRepository;
import com.disasteralert.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceTypeRepository resourceTypeRepository;
    private final UserRepository userRepository;
    private final AlertRepository alertRepository;

    public ResourceService(ResourceRepository resourceRepository,
                          ResourceTypeRepository resourceTypeRepository,
                          UserRepository userRepository,
                          AlertRepository alertRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceTypeRepository = resourceTypeRepository;
        this.userRepository = userRepository;
        this.alertRepository = alertRepository;
    }

    @Transactional
    public ResourceResponse createResource(ResourceRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ResourceType resourceType = resourceTypeRepository.findById(request.getResourceTypeId())
                .orElseThrow(() -> new RuntimeException("Resource type not found"));

        Resource resource = new Resource();
        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());
        resource.setResourceType(resourceType);
        resource.setStatus(Resource.ResourceStatus.valueOf(request.getStatus().toUpperCase()));
        resource.setUser(user);
        resource.setLatitude(request.getLatitude());
        resource.setLongitude(request.getLongitude());
        resource.setContactInfo(request.getContactInfo());

        // Link to alert if provided
        if (request.getAlertId() != null) {
            Alert alert = alertRepository.findById(request.getAlertId())
                    .orElseThrow(() -> new RuntimeException("Alert not found"));
            resource.setAlert(alert);
        }

        Resource savedResource = resourceRepository.save(resource);
        return ResourceResponse.fromEntity(savedResource);
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));
        return ResourceResponse.fromEntity(resource);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getAllResources(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Resource> resourcePage = resourceRepository.findAll(pageable);
        return resourcePage.getContent().stream()
                .map(ResourceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getResourcesByStatus(Resource.ResourceStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Resource> resourcePage = resourceRepository.findByStatus(status, pageable);
        return resourcePage.getContent().stream()
                .map(ResourceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getResourcesNearby(double lat, double lng, double radius, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<Resource> resources = resourceRepository.findNearbyAvailableResources(lat, lng, radius, pageable);
        return resources.stream()
                .map(ResourceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getResourcesByAlert(Long alertId, int page, int size) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Resource> resourcePage = resourceRepository.findByAlert(alert, pageable);
        return resourcePage.getContent().stream()
                .map(ResourceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResourceResponse updateResourceStatus(Long id, Resource.ResourceStatus status, String username) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        // Only the creator can update status
        if (!resource.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to update this resource");
        }

        resource.setStatus(status);
        Resource updatedResource = resourceRepository.save(resource);
        return ResourceResponse.fromEntity(updatedResource);
    }

    @Transactional
    public void deleteResource(Long id, String username) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found with id: " + id));

        // Only the creator can delete
        if (!resource.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this resource");
        }

        resourceRepository.delete(resource);
    }
}
