package com.smartledger.service;

import com.smartledger.model.AuditLog;
import com.smartledger.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logAction(String userEmail, String action, String resourceType, String resourceId, String details) {
        AuditLog log = new AuditLog(userEmail, action, resourceType, resourceId, details);
        auditLogRepository.save(log);
    }
}
