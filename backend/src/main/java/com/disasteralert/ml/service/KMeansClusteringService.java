package com.disasteralert.ml.service;

import com.disasteralert.entity.Alert;
import com.disasteralert.ml.dto.ClusterResultDTO;
import com.disasteralert.repository.AlertRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KMeansClusteringService {

    private static final Logger log = LoggerFactory.getLogger(KMeansClusteringService.class);

    @Autowired
    private AlertRepository alertRepository;

    private List<ClusterResultDTO> cachedResult = new ArrayList<>();

    @PostConstruct
    @Transactional(readOnly = true)
    public void init() {
        runClustering();
    }

    @Scheduled(fixedRate = 600000) // every 10 minutes
    @Transactional(readOnly = true)
    public void runClustering() {
        log.info("Running K-Means clustering on active alerts...");

        // 1. Fetch all active alerts
        List<Alert> alerts = alertRepository.findByStatus(
                Alert.AlertStatus.ACTIVE, Pageable.unpaged()).getContent();

        // 2. If 0 alerts, set empty and return
        if (alerts.isEmpty()) {
            cachedResult = new ArrayList<>();
            log.info("K-Means: No active alerts found, cached result is empty.");
            return;
        }

        int alertCount = alerts.size();
        int k = Math.min(5, alertCount);

        // 3. Init: pick K random alerts' lat/lng as starting centroids
        List<Alert> shuffled = new ArrayList<>(alerts);
        Collections.shuffle(shuffled);
        double[][] centroids = new double[k][2];
        for (int i = 0; i < k; i++) {
            centroids[i][0] = shuffled.get(i).getLatitude();
            centroids[i][1] = shuffled.get(i).getLongitude();
        }

        // Assignment array: alertIndex -> clusterIndex
        int[] assignments = new int[alertCount];

        // 4. Loop max 100 iterations
        for (int iter = 0; iter < 100; iter++) {
            // a. Assign each alert to nearest centroid
            for (int i = 0; i < alertCount; i++) {
                double aLat = alerts.get(i).getLatitude();
                double aLng = alerts.get(i).getLongitude();
                double minDist = Double.MAX_VALUE;
                int bestCluster = 0;
                for (int c = 0; c < k; c++) {
                    double dist = Math.sqrt(
                            Math.pow(aLat - centroids[c][0], 2) +
                                    Math.pow(aLng - centroids[c][1], 2));
                    if (dist < minDist) {
                        minDist = dist;
                        bestCluster = c;
                    }
                }
                assignments[i] = bestCluster;
            }

            // b. Recompute centroids
            double maxMovement = 0.0;
            for (int c = 0; c < k; c++) {
                double sumLat = 0, sumLng = 0;
                int count = 0;
                for (int i = 0; i < alertCount; i++) {
                    if (assignments[i] == c) {
                        sumLat += alerts.get(i).getLatitude();
                        sumLng += alerts.get(i).getLongitude();
                        count++;
                    }
                }
                if (count > 0) {
                    double newLat = sumLat / count;
                    double newLng = sumLng / count;
                    double movement = Math.sqrt(
                            Math.pow(newLat - centroids[c][0], 2) +
                                    Math.pow(newLng - centroids[c][1], 2));
                    maxMovement = Math.max(maxMovement, movement);
                    centroids[c][0] = newLat;
                    centroids[c][1] = newLng;
                }
                // if empty cluster: keep old centroid (no update needed)
            }

            // c. Check convergence
            if (maxMovement < 0.0001) {
                log.info("K-Means converged at iteration {}", iter + 1);
                break;
            }
        }

        // 5. Build result DTOs
        List<ClusterResultDTO> results = new ArrayList<>();
        for (int c = 0; c < k; c++) {
            ClusterResultDTO dto = new ClusterResultDTO();
            dto.setClusterId(c);
            dto.setCentroidLat(centroids[c][0]);
            dto.setCentroidLng(centroids[c][1]);

            // Collect alerts in this cluster
            List<Long> alertIds = new ArrayList<>();
            Map<String, Integer> typeFreq = new HashMap<>();
            double maxRadiusKm = 0.0;

            for (int i = 0; i < alertCount; i++) {
                if (assignments[i] == c) {
                    Alert a = alerts.get(i);
                    alertIds.add(a.getId());
                    String typeName = a.getAlertType().getName();
                    typeFreq.merge(typeName, 1, Integer::sum);

                    // Calculate distance from centroid to this alert
                    double distKm = haversineKm(centroids[c][0], centroids[c][1],
                            a.getLatitude(), a.getLongitude());
                    maxRadiusKm = Math.max(maxRadiusKm, distKm);
                }
            }

            dto.setAlertCount(alertIds.size());
            dto.setAlertIds(alertIds);

            // Dominant alert type: most frequent
            String dominant = typeFreq.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("Unknown");
            dto.setDominantAlertType(dominant);

            // Calculate radius with padding and minimum
            double radiusMeters = Math.max(1000.0, (maxRadiusKm * 1000.0) + 500.0);
            dto.setRadiusMeters(radiusMeters);

            results.add(dto);
        }

        cachedResult = results;
        log.info("K-Means clustering complete. {} clusters formed from {} alerts.", k, alertCount);
    }

    public List<ClusterResultDTO> getCachedResult() {
        return cachedResult;
    }

    /**
     * Haversine formula to calculate distance in kilometers
     * between two lat/lng coordinates
     */
    private double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        final int EARTH_RADIUS_KM = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
