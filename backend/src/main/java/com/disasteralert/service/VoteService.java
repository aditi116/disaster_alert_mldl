package com.disasteralert.service;

import com.disasteralert.entity.Alert;
import com.disasteralert.entity.User;
import com.disasteralert.entity.Vote;
import com.disasteralert.ml.model.ReputationEventType;
import com.disasteralert.ml.service.ReputationService;
import com.disasteralert.repository.AlertRepository;
import com.disasteralert.repository.UserRepository;
import com.disasteralert.repository.VoteRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class VoteService {

    private final VoteRepository voteRepository;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final AlertService alertService;
    private final ReputationService reputationService;

    public VoteService(VoteRepository voteRepository,
                      AlertRepository alertRepository,
                      UserRepository userRepository,
                      AlertService alertService,
                      ReputationService reputationService) {
        this.voteRepository = voteRepository;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.alertService = alertService;
        this.reputationService = reputationService;
    }

    @Transactional
    public void voteOnAlert(Long alertId, Boolean isUpvote, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        Optional<Vote> existingVote = voteRepository.findByAlertAndUser(alert, user);

        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            
            // If the vote is the same, remove it (toggle off)
            if (vote.getIsUpvote().equals(isUpvote)) {
                int scoreDelta = isUpvote ? -1 : 1;
                alertService.updateReliabilityScore(alertId, scoreDelta);
                voteRepository.delete(vote);
            } 
            // If the vote is different, update it
            else {
                int scoreDelta = isUpvote ? 2 : -2; // From -1 to +1 or vice versa
                vote.setIsUpvote(isUpvote);
                voteRepository.save(vote);
                alertService.updateReliabilityScore(alertId, scoreDelta);
            }
        } else {
            // Create new vote
            Vote newVote = new Vote();
            newVote.setAlert(alert);
            newVote.setUser(user);
            newVote.setIsUpvote(isUpvote);
            voteRepository.save(newVote);
            
            int scoreDelta = isUpvote ? 1 : -1;
            alertService.updateReliabilityScore(alertId, scoreDelta);
        }

        // Reputation hooks — re-fetch alert to get updated reliability score
        alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        // If alert crosses upvote threshold (10+ upvotes), reward alert creator
        long upvotes = voteRepository.countUpvotesByAlertId(alertId);
        if (upvotes == 10) { // exactly 10 to avoid firing repeatedly
            reputationService.applyEvent(alert.getUser().getId(),
                    ReputationEventType.ALERT_CONFIRMED, alertId);
        }

        // If alert drops below -5 reliability, penalize creator
        if (alert.getReliabilityScore() <= -5) {
            reputationService.applyEvent(alert.getUser().getId(),
                    ReputationEventType.LOW_RELIABILITY, alertId);
        }
    }

    @Transactional(readOnly = true)
    public long getUpvoteCount(Long alertId) {
        return voteRepository.countUpvotesByAlertId(alertId);
    }

    @Transactional(readOnly = true)
    public long getDownvoteCount(Long alertId) {
        return voteRepository.countDownvotesByAlertId(alertId);
    }

    @Transactional(readOnly = true)
    public Boolean getUserVote(Long alertId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        Optional<Vote> vote = voteRepository.findByAlertAndUser(alert, user);
        return vote.map(Vote::getIsUpvote).orElse(null);
    }
}
