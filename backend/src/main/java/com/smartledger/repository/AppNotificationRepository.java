package com.smartledger.repository;

import com.smartledger.model.AppNotification;
import com.smartledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByUserOrderByCreatedAtDesc(User user);
    List<AppNotification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);
    int countByUserAndIsReadFalse(User user);
}
