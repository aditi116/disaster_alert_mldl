package com.disasteralert.repository;

import com.disasteralert.entity.Alert;
import com.disasteralert.entity.Resource;
import com.disasteralert.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    Page<Resource> findByStatus(Resource.ResourceStatus status, Pageable pageable);
    
    Page<Resource> findByUser(User user, Pageable pageable);
    
    Page<Resource> findByAlert(Alert alert, Pageable pageable);
    
    @Query("SELECT r FROM Resource r WHERE " +
           "(r.latitude BETWEEN :minLat AND :maxLat) AND " +
           "(r.longitude BETWEEN :minLng AND :maxLng) " +
           "AND r.status = 'AVAILABLE' " +
           "ORDER BY r.createdAt DESC")
    List<Resource> findAvailableWithinBoundingBox(
        @Param("minLat") double minLat,
        @Param("maxLat") double maxLat,
        @Param("minLng") double minLng,
        @Param("maxLng") double maxLng,
        Pageable pageable
    );
    
    @Query(value = "SELECT r.* FROM resources r WHERE " +
            "ST_Distance_Sphere(point(r.longitude, r.latitude), point(:lng, :lat)) <= :radius " +
            "AND r.status = 'AVAILABLE' " +
            "ORDER BY r.created_at DESC", 
            nativeQuery = true)
    List<Resource> findNearbyAvailableResources(
        @Param("lat") double latitude,
        @Param("lng") double longitude,
        @Param("radius") double radiusInMeters,
        Pageable pageable
    );
    
    @Query("SELECT r FROM Resource r WHERE " +
           "r.resourceType.id = :typeId AND " +
           "r.status = 'AVAILABLE' " +
           "ORDER BY r.createdAt DESC")
    Page<Resource> findByResourceTypeAndAvailable(
        @Param("typeId") Integer typeId,
        Pageable pageable
    );
    
    Long countByUser_Id(Long userId);
    
    Long countByAlert_Id(Long alertId);
}
