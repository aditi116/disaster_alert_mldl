package com.disasteralert.ml.controller;

import com.disasteralert.ml.dto.ClusterResultDTO;
import com.disasteralert.ml.service.KMeansClusteringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/ml/hotspots")
public class HotspotController {

    @Autowired
    private KMeansClusteringService kMeansClusteringService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getHotspots() {
        List<ClusterResultDTO> clusters = kMeansClusteringService.getCachedResult();
        return ResponseEntity.ok(clusters);
    }
}
