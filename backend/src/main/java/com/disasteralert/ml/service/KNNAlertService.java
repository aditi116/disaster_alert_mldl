package com.disasteralert.ml.service;

import com.disasteralert.entity.Alert;
import com.disasteralert.ml.dto.SimilarAlertDTO;
import com.disasteralert.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KNNAlertService {

    private static final int K = 5;

    private static final Map<String, Integer> TYPE_ENCODING = Map.of(
            "Fire", 1,
            "Flood", 2,
            "Medical Emergency", 3,
            "Power Outage", 4,
            "Other", 5
    );

    @Autowired
    private AlertRepository alertRepository;

    public List<SimilarAlertDTO> findSimilarAlerts(double lat, double lng,
                                                    String alertTypeName, int severity) {
        List<Alert> allAlerts = alertRepository.findAll();
        if (allAlerts.isEmpty()) {
            return Collections.emptyList();
        }

        int queryType = encodeType(alertTypeName);

        // Compute min/max for normalization across all fetched alerts
        double minLat = Double.MAX_VALUE, maxLat = -Double.MAX_VALUE;
        double minLng = Double.MAX_VALUE, maxLng = -Double.MAX_VALUE;
        double minSev = Double.MAX_VALUE, maxSev = -Double.MAX_VALUE;
        double minType = Double.MAX_VALUE, maxType = -Double.MAX_VALUE;

        for (Alert a : allAlerts) {
            double aLat = a.getLatitude();
            double aLng = a.getLongitude();
            double aSev = a.getSeverity() != null ? a.getSeverity() : 0;
            double aType = encodeType(a.getAlertType().getName());

            minLat = Math.min(minLat, aLat);
            maxLat = Math.max(maxLat, aLat);
            minLng = Math.min(minLng, aLng);
            maxLng = Math.max(maxLng, aLng);
            minSev = Math.min(minSev, aSev);
            maxSev = Math.max(maxSev, aSev);
            minType = Math.min(minType, aType);
            maxType = Math.max(maxType, aType);
        }

        // Also include the query point in min/max
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minSev = Math.min(minSev, severity);
        maxSev = Math.max(maxSev, severity);
        minType = Math.min(minType, queryType);
        maxType = Math.max(maxType, queryType);

        double normQueryLat = normalize(lat, minLat, maxLat);
        double normQueryLng = normalize(lng, minLng, maxLng);
        double normQuerySev = normalize(severity, minSev, maxSev);
        double normQueryType = normalize(queryType, minType, maxType);

        // Compute distances
        List<AlertDistance> distances = new ArrayList<>();
        for (Alert a : allAlerts) {
            double aLat = a.getLatitude();
            double aLng = a.getLongitude();
            double aSev = a.getSeverity() != null ? a.getSeverity() : 0;
            double aType = encodeType(a.getAlertType().getName());

            double nLat = normalize(aLat, minLat, maxLat);
            double nLng = normalize(aLng, minLng, maxLng);
            double nSev = normalize(aSev, minSev, maxSev);
            double nType = normalize(aType, minType, maxType);

            double dist = Math.sqrt(
                    Math.pow(nLat - normQueryLat, 2) +
                    Math.pow(nLng - normQueryLng, 2) +
                    Math.pow(nSev - normQuerySev, 2) +
                    Math.pow(nType - normQueryType, 2)
            );

            distances.add(new AlertDistance(a, dist));
        }

        // Sort by distance ascending and return top K
        return distances.stream()
                .sorted(Comparator.comparingDouble(ad -> ad.distance))
                .limit(K)
                .map(ad -> {
                    SimilarAlertDTO dto = new SimilarAlertDTO();
                    dto.setId(ad.alert.getId());
                    dto.setTitle(ad.alert.getTitle());
                    dto.setAlertType(ad.alert.getAlertType().getName());
                    dto.setSeverity(ad.alert.getSeverity());
                    dto.setLatitude(ad.alert.getLatitude());
                    dto.setLongitude(ad.alert.getLongitude());
                    dto.setStatus(ad.alert.getStatus().name());
                    dto.setReliabilityScore(ad.alert.getReliabilityScore());
                    dto.setDistanceScore(ad.distance);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    private int encodeType(String alertTypeName) {
        if (alertTypeName == null) return 0;
        return TYPE_ENCODING.getOrDefault(alertTypeName, 0);
    }

    private double normalize(double val, double min, double max) {
        if (max - min == 0) return 0;
        return (val - min) / (max - min);
    }

    private static class AlertDistance {
        final Alert alert;
        final double distance;

        AlertDistance(Alert alert, double distance) {
            this.alert = alert;
            this.distance = distance;
        }
    }
}
