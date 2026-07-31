package com.smartledger.controller;

import com.smartledger.model.AuditLog;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.service.AuditLogService;
import com.smartledger.service.SystemAdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final SystemAdminService systemAdminService;

    public ActivityController(SystemAdminService systemAdminService) {
        this.systemAdminService = systemAdminService;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<AuditLog>> getActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logPage = systemAdminService.getSystemLogs(pageable);
        return ResponseEntity.ok(new PaginatedResponse<>(
                logPage.getContent(),
                logPage.getNumber(),
                logPage.getTotalPages(),
                logPage.getTotalElements()
        ));
    }
}
