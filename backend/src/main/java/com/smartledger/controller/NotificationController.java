package com.smartledger.controller;

import com.smartledger.model.dto.ApiResponse;
import com.smartledger.model.dto.AppNotificationResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping
    public ResponseEntity<List<AppNotificationResponse>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications(getAuthenticatedUserEmail()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<AppNotificationResponse>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(getAuthenticatedUserEmail()));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount() {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(getAuthenticatedUserEmail())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(getAuthenticatedUserEmail(), id);
        return ResponseEntity.ok(new ApiResponse(true, "Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead() {
        notificationService.markAllAsRead(getAuthenticatedUserEmail());
        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read"));
    }
}
