package com.disasteralert.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
public class Alert {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String title;

    @Lob
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_type_id", nullable = false)
    private AlertType alertType;

    @Min(1)
    @Max(5)
    private Integer severity;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AlertStatus status = AlertStatus.ACTIVE;

    @Column(name = "reliability_score")
    private Integer reliabilityScore = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AlertStatus {
        ACTIVE, RESOLVED, FALSE_ALARM
    }
}
