package com.disasteralert.ml.repository;

import com.disasteralert.ml.model.ReputationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReputationEventRepository extends JpaRepository<ReputationEvent, Long> {
    List<ReputationEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
}
