package com.smartledger.service;

import com.smartledger.model.AuditLog;
import com.smartledger.model.InvoiceStatus;
import com.smartledger.model.dto.AdminCompanyResponse;
import com.smartledger.model.dto.AdminDashboardMetricsResponse;
import com.smartledger.model.dto.AdminUserResponse;
import com.smartledger.repository.AuditLogRepository;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.InvoiceRepository;
import com.smartledger.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SystemAdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogRepository auditLogRepository;

    public SystemAdminService(UserRepository userRepository, CompanyRepository companyRepository, InvoiceRepository invoiceRepository, AuditLogRepository auditLogRepository) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.invoiceRepository = invoiceRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardMetricsResponse getPlatformMetrics() {
        long totalUsers = userRepository.count();
        long totalCompanies = companyRepository.count();
        long totalInvoices = invoiceRepository.count();
        
        // Sum of all paid invoices across the platform
        double totalPlatformRevenue = invoiceRepository.findAll().stream()
                .filter(i -> i.getStatus() == InvoiceStatus.PAID)
                .mapToDouble(i -> i.getTotalAmount())
                .sum();

        return new AdminDashboardMetricsResponse(totalUsers, totalCompanies, totalInvoices, totalPlatformRevenue);
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(AdminUserResponse::new);
    }

    @Transactional(readOnly = true)
    public Page<AdminCompanyResponse> getAllCompanies(Pageable pageable) {
        return companyRepository.findAll(pageable).map(AdminCompanyResponse::new);
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> getSystemLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
