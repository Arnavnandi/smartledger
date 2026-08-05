package com.smartledger.controller;

import com.smartledger.model.AuditLog;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.service.AuditLogService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final AuditLogService auditLogService;

    public ActivityController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<AuditLog>> getActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();

        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logPage = auditLogService.getUserActivityLogs(userEmail, pageable);
        return ResponseEntity.ok(new PaginatedResponse<>(
                logPage.getContent(),
                logPage.getNumber(),
                logPage.getTotalPages(),
                logPage.getTotalElements()
        ));
    }
}
