package com.smartledger.model.dto;

import com.smartledger.model.AppNotification;
import com.smartledger.model.NotificationType;

import java.time.LocalDateTime;

public class AppNotificationResponse {
    private Long id;
    private String message;
    private NotificationType type;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public AppNotificationResponse(AppNotification notification) {
        this.id = notification.getId();
        this.message = notification.getMessage();
        this.type = notification.getType();
        this.isRead = notification.getIsRead();
        this.createdAt = notification.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getMessage() { return message; }
    public NotificationType getType() { return type; }
    public Boolean getIsRead() { return isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
