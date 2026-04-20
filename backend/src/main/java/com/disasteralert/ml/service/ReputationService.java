package com.disasteralert.ml.service;

import com.disasteralert.entity.Role;
import com.disasteralert.entity.User;
import com.disasteralert.exception.ResourceNotFoundException;
import com.disasteralert.ml.dto.ReputationEventDTO;
import com.disasteralert.ml.dto.ReputationSummaryDTO;
import com.disasteralert.ml.model.ReputationEvent;
import com.disasteralert.ml.model.ReputationEventType;
import com.disasteralert.ml.repository.ReputationEventRepository;
import com.disasteralert.repository.AlertRepository;
import com.disasteralert.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReputationService {

    @Autowired
    private ReputationEventRepository reputationEventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Transactional
    public void applyEvent(Long userId, ReputationEventType eventType, Long alertId) {
        // 1. Fetch user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // 2. Create and save reputation event
        ReputationEvent event = new ReputationEvent();
        event.setUserId(userId);
        event.setEventType(eventType);
        event.setPoints(eventType.getPoints());
        event.setAlertId(alertId);
        reputationEventRepository.save(event);

        // 3. Compute new score, clamped to minimum 0
        int newScore = Math.max(0, user.getReputationScore() + eventType.getPoints());
        user.setReputationScore(newScore);

        // 4. Save user
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public ReputationSummaryDTO getReputation(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<ReputationEvent> events = reputationEventRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<ReputationEventDTO> eventDTOs = events.stream()
                .map(event -> {
                    ReputationEventDTO dto = new ReputationEventDTO();
                    dto.setId(event.getId());
                    dto.setEventType(event.getEventType().name());
                    dto.setPoints(event.getPoints());
                    dto.setAlertId(event.getAlertId());
                    dto.setCreatedAt(event.getCreatedAt());
                    return dto;
                })
                .collect(Collectors.toList());

        ReputationSummaryDTO summary = new ReputationSummaryDTO();
        summary.setUserId(user.getId());
        summary.setUsername(user.getUsername());
        summary.setReputationScore(user.getReputationScore());
        summary.setEvents(eventDTOs);

        return summary;
    }
}
