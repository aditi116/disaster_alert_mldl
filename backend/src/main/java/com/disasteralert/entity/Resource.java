package com.disasteralert.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "resources")
public class Resource {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Lob
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_type_id", nullable = false)
    private ResourceType resourceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_status", length = 20, nullable = false)
    private ResourceStatus status = ResourceStatus.AVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id")
    private Alert alert;

    private Double latitude;

    private Double longitude;

    @Size(max = 255)
    @Column(name = "contact_info")
    private String contactInfo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ResourceStatus {
        AVAILABLE,   // Resource is available
        REQUESTED,   // Someone has requested this resource
        RESERVED,    // Resource is reserved for someone
        FULFILLED    // Resource has been provided
    }
}
