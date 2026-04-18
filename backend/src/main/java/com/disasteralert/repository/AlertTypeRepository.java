package com.disasteralert.repository;

import com.disasteralert.entity.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertTypeRepository extends JpaRepository<AlertType, Integer> {
    Optional<AlertType> findByName(String name);
}
