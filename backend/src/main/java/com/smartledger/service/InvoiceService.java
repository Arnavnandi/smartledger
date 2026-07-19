package com.smartledger.service;

import com.smartledger.model.*;
import com.smartledger.model.dto.*;
import com.smartledger.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceActivityRepository invoiceActivityRepository;
    private final ClientRepository clientRepository;
    private final CompanyRepository companyRepository;
    private final PdfService pdfService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;

    public InvoiceService(InvoiceRepository invoiceRepository, 
                          InvoiceActivityRepository invoiceActivityRepository, 
                          ClientRepository clientRepository,
                          CompanyRepository companyRepository,
                          PdfService pdfService,
                          EmailService emailService,
                          NotificationService notificationService,
                          AuditLogService auditLogService,
                          AuthContextService authContextService,
                          CurrencyService currencyService) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceActivityRepository = invoiceActivityRepository;
        this.clientRepository = clientRepository;
        this.companyRepository = companyRepository;
        this.pdfService = pdfService;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
    }

    private InvoiceResponse mapToResponse(Invoice invoice, Company company) {
        InvoiceResponse response = new InvoiceResponse(invoice);
        String currency = company.getCurrency();
        response.setSubTotal(currencyService.convertToDisplay(invoice.getSubTotal(), currency));
        response.setTaxTotal(currencyService.convertToDisplay(invoice.getTaxTotal(), currency));
        response.setDiscountTotal(currencyService.convertToDisplay(invoice.getDiscountTotal(), currency));
        response.setTotalAmount(currencyService.convertToDisplay(invoice.getTotalAmount(), currency));
        if (response.getItems() != null) {
            response.getItems().forEach(item -> {
                item.setUnitPrice(currencyService.convertToDisplay(item.getUnitPrice(), currency));
                item.setTotal(currencyService.convertToDisplay(item.getTotal(), currency));
            });
        }
        return response;
    }



    public PaginatedResponse<InvoiceResponse> getInvoices(String email, String search, String statusStr, Pageable pageable) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Page<Invoice> page;
        if (search != null && !search.trim().isEmpty()) {
            page = invoiceRepository.searchByCompanyAndKeyword(company, search.trim(), pageable);
        } else if (statusStr != null && !statusStr.isEmpty()) {
            try {
                InvoiceStatus status = InvoiceStatus.valueOf(statusStr.toUpperCase());
                page = invoiceRepository.findByCompanyAndStatus(company, status, pageable);
            } catch (IllegalArgumentException e) {
                page = invoiceRepository.findByCompany(company, pageable);
            }
        } else {
            page = invoiceRepository.findByCompany(company, pageable);
        }

        List<InvoiceResponse> responses = page.getContent().stream()
                .map(i -> mapToResponse(i, company))
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                responses,
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<InvoiceResponse> searchInvoices(String email, com.smartledger.model.dto.InvoiceFilterRequest filter, Pageable pageable) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        org.springframework.data.jpa.domain.Specification<Invoice> spec = com.smartledger.specification.InvoiceSpecification.filterBy(company, filter);
        Page<Invoice> page = invoiceRepository.findAll(spec, pageable);
        
        List<InvoiceResponse> responses = page.getContent().stream()
                .map(i -> mapToResponse(i, company))
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                responses,
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements()
        );
    }

    public InvoiceResponse getInvoiceById(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return mapToResponse(invoice, company);
    }

    public List<InvoiceActivityResponse> getInvoiceActivity(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        
        return invoiceActivityRepository.findByInvoiceOrderByTimestampDesc(invoice).stream()
                .map(InvoiceActivityResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public InvoiceResponse createInvoice(String email, InvoiceRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(request.getClientId(), company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        // Generate Invoice Number
        int nextSequence = (company.getLastInvoiceSequence() == null ? 0 : company.getLastInvoiceSequence()) + 1;
        company.setLastInvoiceSequence(nextSequence);
        String prefix = company.getInvoicePrefix() != null ? company.getInvoicePrefix() : "INV-";
        String invoiceNumber = prefix + String.format("%04d", nextSequence);
        companyRepository.save(company);

        Invoice invoice = new Invoice();
        invoice.setCompany(company);
        invoice.setClient(client);
        invoice.setInvoiceNumber(invoiceNumber);
        
        updateInvoiceFromRequest(invoice, request);
        
        invoice = invoiceRepository.save(invoice);
        
        logActivity(invoice, "CREATED", "Invoice " + invoiceNumber + " created");
        auditLogService.logAction(email, "INVOICE_CREATED", "Invoice", invoice.getId().toString(), "Created invoice " + invoiceNumber + " for " + client.getName());
        
        return mapToResponse(invoice, company);
    }

    @Transactional
    public InvoiceResponse updateInvoice(String email, Long id, InvoiceRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
                
        // Only allow edits if DRAFT
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT invoices can be edited");
        }

        Client client = clientRepository.findByIdAndCompany(request.getClientId(), company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        invoice.setClient(client);
        
        updateInvoiceFromRequest(invoice, request);
        
        invoice = invoiceRepository.save(invoice);
        logActivity(invoice, "UPDATED", "Invoice details updated");
        
        return new InvoiceResponse(invoice);
    }

    @Transactional
    public InvoiceResponse updateInvoiceStatus(String email, Long id, InvoiceStatusUpdateRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
                
        InvoiceStatus newStatus;
        try {
            newStatus = InvoiceStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status");
        }

        InvoiceStatus oldStatus = invoice.getStatus();
        if (oldStatus == newStatus) {
            return new InvoiceResponse(invoice); // No change
        }

        invoice.setStatus(newStatus);
        invoice = invoiceRepository.save(invoice);

        if (oldStatus != InvoiceStatus.PAID && newStatus == InvoiceStatus.PAID) {
            emailService.sendPaymentSuccess(invoice);
            String currency = company.getCurrency() != null ? company.getCurrency() : "$";
            notificationService.createNotification(
                company.getOwner(),
                "Client " + invoice.getClient().getName() + " paid Invoice #" + invoice.getInvoiceNumber() + " (" + currency + String.format("%.2f", invoice.getTotalAmount()) + ")",
                com.smartledger.model.NotificationType.SUCCESS
            );
        }

        // Update Client Outstanding Balance
        Client client = invoice.getClient();
        if ((oldStatus == InvoiceStatus.DRAFT || oldStatus == InvoiceStatus.CANCELLED) && 
            (newStatus == InvoiceStatus.PENDING || newStatus == InvoiceStatus.OVERDUE)) {
            // Balance increases
            client.setOutstandingBalance(client.getOutstandingBalance() + invoice.getTotalAmount());
            clientRepository.save(client);
        } else if ((oldStatus == InvoiceStatus.PENDING || oldStatus == InvoiceStatus.OVERDUE) && 
                   (newStatus == InvoiceStatus.PAID || newStatus == InvoiceStatus.CANCELLED)) {
            // Balance decreases
            client.setOutstandingBalance(client.getOutstandingBalance() - invoice.getTotalAmount());
            clientRepository.save(client);
        }

        String note = request.getNote() != null && !request.getNote().isEmpty() ? " - " + request.getNote() : "";
        logActivity(invoice, "STATUS_CHANGED", "Status changed from " + oldStatus + " to " + newStatus + note);
        auditLogService.logAction(email, "INVOICE_STATUS_UPDATE", "Invoice", invoice.getId().toString(), "Status changed from " + oldStatus + " to " + newStatus);
        
        return mapToResponse(invoice, company);
    }

    @Transactional
    public void deleteInvoice(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
                
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT invoices can be deleted");
        }

        invoiceActivityRepository.deleteAll(invoiceActivityRepository.findByInvoiceOrderByTimestampDesc(invoice));
        invoiceRepository.delete(invoice);
    }

    public byte[] getInvoicePdf(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        return pdfService.generateInvoicePdf(invoice);
    }

    @Transactional
    public void sendInvoiceEmail(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Invoice invoice = invoiceRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        byte[] pdf = pdfService.generateInvoicePdf(invoice);
        emailService.sendInvoiceEmail(invoice, pdf);

        if (invoice.getStatus() == InvoiceStatus.DRAFT) {
            invoice.setStatus(InvoiceStatus.PENDING);
            invoice = invoiceRepository.save(invoice);
            
            // Update Client Balance
            Client client = invoice.getClient();
            client.setOutstandingBalance(client.getOutstandingBalance() + invoice.getTotalAmount());
            clientRepository.save(client);
        }

        logActivity(invoice, "EMAIL_SENT", "Invoice emailed to " + invoice.getClient().getEmail());
    }

    private void updateInvoiceFromRequest(Invoice invoice, InvoiceRequest request) {
        invoice.setIssueDate(request.getIssueDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setNotes(request.getNotes());
        invoice.setTerms(request.getTerms());
        
        try {
            if (request.getStatus() != null) {
                invoice.setStatus(InvoiceStatus.valueOf(request.getStatus().toUpperCase()));
            } else {
                invoice.setStatus(InvoiceStatus.DRAFT);
            }
        } catch (IllegalArgumentException e) {
            invoice.setStatus(InvoiceStatus.DRAFT);
        }

        // Clear existing items and replace
        invoice.getItems().clear();

        double subTotal = 0.0;
        double taxTotal = 0.0;
        double discountTotal = 0.0;
        double finalTotal = 0.0;

        for (InvoiceItemRequest itemReq : request.getItems()) {
            InvoiceItem item = new InvoiceItem();
            item.setDescription(itemReq.getDescription());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(currencyService.convertToBase(itemReq.getUnitPrice(), invoice.getCompany().getCurrency()));
            item.setTaxRate(itemReq.getTaxRate() != null ? itemReq.getTaxRate() : 0.0);
            item.setDiscount(itemReq.getDiscount() != null ? itemReq.getDiscount() : 0.0);
            
            double itemSubtotal = item.getQuantity() * item.getUnitPrice();
            double itemDiscount = itemSubtotal * (item.getDiscount() / 100.0);
            double itemPostDiscount = itemSubtotal - itemDiscount;
            double itemTax = itemPostDiscount * (item.getTaxRate() / 100.0);
            double itemTotal = itemPostDiscount + itemTax;
            
            item.setTotal(itemTotal);
            invoice.addItem(item);

            subTotal += itemSubtotal;
            discountTotal += itemDiscount;
            taxTotal += itemTax;
            finalTotal += itemTotal;
        }

        invoice.setSubTotal(subTotal);
        invoice.setDiscountTotal(discountTotal);
        invoice.setTaxTotal(taxTotal);
        invoice.setTotalAmount(finalTotal);
    }

    private void logActivity(Invoice invoice, String action, String description) {
        InvoiceActivity activity = new InvoiceActivity(invoice, action, description);
        invoiceActivityRepository.save(activity);
    }
}
