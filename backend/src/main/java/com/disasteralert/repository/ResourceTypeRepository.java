package com.disasteralert.repository;

import com.disasteralert.entity.ResourceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResourceTypeRepository extends JpaRepository<ResourceType, Integer> {
    Optional<ResourceType> findByName(String name);
}
