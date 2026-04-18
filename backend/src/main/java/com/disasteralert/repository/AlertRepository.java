package com.disasteralert.repository;

import com.disasteralert.entity.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    
    Page<Alert> findByStatus(Alert.AlertStatus status, Pageable pageable);
    
    @Query("SELECT a FROM Alert a WHERE " +
           "(a.latitude BETWEEN :minLat AND :maxLat) AND " +
           "(a.longitude BETWEEN :minLng AND :maxLng) " +
           "ORDER BY a.createdAt DESC")
    List<Alert> findWithinBoundingBox(
        @Param("minLat") double minLat,
        @Param("maxLat") double maxLat,
        @Param("minLng") double minLng,
        @Param("maxLng") double maxLng,
        Pageable pageable
    );
    
    @Query(value = "SELECT a.* FROM alerts a WHERE " +
            "ST_Distance_Sphere(point(a.longitude, a.latitude), point(:lng, :lat)) <= :radius " +
            "AND a.status = 'ACTIVE' " +
            "ORDER BY a.created_at DESC", 
            nativeQuery = true)
    List<Alert> findNearbyAlerts(
        @Param("lat") double latitude,
        @Param("lng") double longitude,
        @Param("radius") double radiusInMeters,
        Pageable pageable
    );
    
    Long countByUser_Id(Long userId);
}
