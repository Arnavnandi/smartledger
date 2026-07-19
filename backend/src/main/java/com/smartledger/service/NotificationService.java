package com.smartledger.service;

import com.smartledger.model.AppNotification;
import com.smartledger.model.NotificationType;
import com.smartledger.model.User;
import com.smartledger.model.dto.AppNotificationResponse;
import com.smartledger.repository.AppNotificationRepository;
import com.smartledger.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final AppNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(AppNotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createNotification(User user, String message, NotificationType type) {
        AppNotification notification = new AppNotification(user, message, type);
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<AppNotificationResponse> getUnreadNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user)
                .stream()
                .map(AppNotificationResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppNotificationResponse> getAllNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(AppNotificationResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public int getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        AppNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<AppNotification> unread = notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user);
        for (AppNotification notification : unread) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
