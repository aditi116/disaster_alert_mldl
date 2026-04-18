package com.disasteralert.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Entity
@Table(name = "alert_types")
public class AlertType {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    @Size(max = 50)
    @Column(unique = true)
    private String name;

    @Size(max = 255)
    private String description;
    
    @Size(max = 50)
    private String icon;
}
