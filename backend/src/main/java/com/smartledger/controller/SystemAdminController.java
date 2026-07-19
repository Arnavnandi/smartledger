package com.smartledger.controller;

import com.smartledger.model.AuditLog;
import com.smartledger.model.dto.AdminCompanyResponse;
import com.smartledger.model.dto.AdminDashboardMetricsResponse;
import com.smartledger.model.dto.AdminUserResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.service.SystemAdminService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class SystemAdminController {

    private final SystemAdminService systemAdminService;

    public SystemAdminController(SystemAdminService systemAdminService) {
        this.systemAdminService = systemAdminService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<AdminDashboardMetricsResponse> getMetrics() {
        return ResponseEntity.ok(systemAdminService.getPlatformMetrics());
    }

    @GetMapping("/users")
    public ResponseEntity<PaginatedResponse<AdminUserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AdminUserResponse> userPage = systemAdminService.getAllUsers(pageable);
        return ResponseEntity.ok(new PaginatedResponse<>(
                userPage.getContent(),
                userPage.getNumber(),
                userPage.getTotalPages(),
                userPage.getTotalElements()
        ));
    }

    @GetMapping("/companies")
    public ResponseEntity<PaginatedResponse<AdminCompanyResponse>> getCompanies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AdminCompanyResponse> companyPage = systemAdminService.getAllCompanies(pageable);
        return ResponseEntity.ok(new PaginatedResponse<>(
                companyPage.getContent(),
                companyPage.getNumber(),
                companyPage.getTotalPages(),
                companyPage.getTotalElements()
        ));
    }

    @GetMapping("/logs")
    public ResponseEntity<PaginatedResponse<AuditLog>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
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
