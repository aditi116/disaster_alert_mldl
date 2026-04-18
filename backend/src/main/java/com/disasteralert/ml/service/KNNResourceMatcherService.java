package com.disasteralert.ml.service;

import com.disasteralert.entity.Resource;
import com.disasteralert.ml.dto.NearestResourceDTO;
import com.disasteralert.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KNNResourceMatcherService {

    private static final int K = 3;
    private static final double EARTH_RADIUS_KM = 6371.0;

    @Autowired
    private ResourceRepository resourceRepository;

    public List<NearestResourceDTO> findNearestResources(double lat, double lng) {
        List<Resource> allResources = resourceRepository.findAll();

        // Filter: status==AVAILABLE AND latitude!=null AND longitude!=null
        List<Resource> available = allResources.stream()
                .filter(r -> r.getStatus() == Resource.ResourceStatus.AVAILABLE)
                .filter(r -> r.getLatitude() != null && r.getLongitude() != null)
                .collect(Collectors.toList());

        if (available.isEmpty()) {
            return Collections.emptyList();
        }

        // Compute Haversine distances and sort
        List<ResourceDistance> distances = new ArrayList<>();
        for (Resource r : available) {
            double dist = haversine(lat, lng, r.getLatitude(), r.getLongitude());
            distances.add(new ResourceDistance(r, dist));
        }

        return distances.stream()
                .sorted(Comparator.comparingDouble(rd -> rd.distanceKm))
                .limit(K)
                .map(rd -> {
                    NearestResourceDTO dto = new NearestResourceDTO();
                    dto.setId(rd.resource.getId());
                    dto.setTitle(rd.resource.getTitle());
                    dto.setResourceType(rd.resource.getResourceType().getName());
                    dto.setStatus(rd.resource.getStatus().name());
                    dto.setContactInfo(rd.resource.getContactInfo());
                    dto.setLatitude(rd.resource.getLatitude());
                    dto.setLongitude(rd.resource.getLongitude());
                    dto.setDistanceKm(rd.distanceKm);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }

    private static class ResourceDistance {
        final Resource resource;
        final double distanceKm;

        ResourceDistance(Resource resource, double distanceKm) {
            this.resource = resource;
            this.distanceKm = distanceKm;
        }
    }
}
