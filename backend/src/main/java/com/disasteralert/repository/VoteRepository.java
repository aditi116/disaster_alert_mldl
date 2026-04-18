package com.disasteralert.repository;

import com.disasteralert.entity.Alert;
import com.disasteralert.entity.User;
import com.disasteralert.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    
    Optional<Vote> findByAlertAndUser(Alert alert, User user);
    
    @Query("SELECT COUNT(v) > 0 FROM Vote v WHERE v.alert.id = :alertId AND v.user.id = :userId")
    boolean existsByAlertIdAndUserId(@Param("alertId") Long alertId, @Param("userId") Long userId);
    
    @Modifying
    @Query("DELETE FROM Vote v WHERE v.alert.id = :alertId AND v.user.id = :userId")
    void deleteByAlertIdAndUserId(@Param("alertId") Long alertId, @Param("userId") Long userId);
    
    @Query("SELECT COUNT(v) FROM Vote v WHERE v.alert.id = :alertId AND v.isUpvote = true")
    long countUpvotesByAlertId(@Param("alertId") Long alertId);
    
    @Query("SELECT COUNT(v) FROM Vote v WHERE v.alert.id = :alertId AND v.isUpvote = false")
    long countDownvotesByAlertId(@Param("alertId") Long alertId);
}
