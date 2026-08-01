package com.smartledger.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.model.AuditLog;
import com.smartledger.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void logAction(String userEmail, String action, String resourceType, String resourceId, String details) {
        AuditLog log = new AuditLog(userEmail, action, resourceType, resourceId, details);
        auditLogRepository.save(log);
    }

    @Transactional
    public void logEvent(String userEmail, String userRole, String ipAddress, String userAgent, 
                         String actionType, String entityType, String entityId, 
                         String description, Object oldValueObj, Object newValueObj, String status) {
        String oldJson = null;
        String newJson = null;

        try {
            if (oldValueObj != null) {
                oldJson = oldValueObj instanceof String ? (String) oldValueObj : objectMapper.writeValueAsString(oldValueObj);
            }
            if (newValueObj != null) {
                newJson = newValueObj instanceof String ? (String) newValueObj : objectMapper.writeValueAsString(newValueObj);
            }
        } catch (Exception e) {
            oldJson = String.valueOf(oldValueObj);
            newJson = String.valueOf(newValueObj);
        }

        AuditLog log = new AuditLog(
                userEmail != null ? userEmail : "SYSTEM",
                userRole != null ? userRole : "ROLE_USER",
                ipAddress != null ? ipAddress : "127.0.0.1",
                userAgent,
                actionType,
                entityType,
                entityId,
                description,
                oldJson,
                newJson,
                status != null ? status : "SUCCESS"
        );
        auditLogRepository.save(log);
    }
}
