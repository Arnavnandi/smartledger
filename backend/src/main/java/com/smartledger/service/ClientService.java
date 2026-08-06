package com.smartledger.service;

import com.smartledger.model.Client;
import com.smartledger.model.ClientActivity;
import com.smartledger.model.Company;
import com.smartledger.model.dto.ClientActivityResponse;
import com.smartledger.model.dto.ClientRequest;
import com.smartledger.model.dto.ClientResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.model.dto.GenerateOpeningBalanceInvoiceRequest;
import com.smartledger.model.dto.InvoiceResponse;
import com.smartledger.repository.ClientActivityRepository;
import com.smartledger.repository.ClientRepository;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.InvoiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientActivityRepository clientActivityRepository;
    private final InvoiceRepository invoiceRepository;
    private final CompanyRepository companyRepository;
    private final InvoiceService invoiceService;
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;
    private final ClientBalanceService clientBalanceService;
    private final AuditLogService auditLogService;

    public ClientService(ClientRepository clientRepository, 
                         ClientActivityRepository clientActivityRepository,
                         InvoiceRepository invoiceRepository,
                         CompanyRepository companyRepository,
                         InvoiceService invoiceService,
                         AuthContextService authContextService,
                         CurrencyService currencyService,
                         ClientBalanceService clientBalanceService,
                         AuditLogService auditLogService) {
        this.clientRepository = clientRepository;
        this.clientActivityRepository = clientActivityRepository;
        this.invoiceRepository = invoiceRepository;
        this.companyRepository = companyRepository;
        this.invoiceService = invoiceService;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
        this.clientBalanceService = clientBalanceService;
        this.auditLogService = auditLogService;
    }

    public PaginatedResponse<ClientResponse> getClients(String email, String search, Pageable pageable) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Page<Client> page;
        if (search != null && !search.trim().isEmpty()) {
            page = clientRepository.searchByCompanyAndKeyword(company, search.trim(), pageable);
        } else {
            page = clientRepository.findByCompany(company, pageable);
        }

        List<ClientResponse> responses = page.getContent().stream()
                .map(c -> clientBalanceService.buildClientResponse(c, company.getCurrency()))
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                responses,
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements()
        );
    }

    public ClientResponse getClientById(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        return clientBalanceService.buildClientResponse(client, company.getCurrency());
    }

    public List<ClientActivityResponse> getClientActivity(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        return clientActivityRepository.findByClientOrderByTimestampDesc(client).stream()
                .map(ClientActivityResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClientResponse createClient(String email, ClientRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Client client = new Client();
        client.setCompany(company);
        updateClientFromRequest(client, request);
        
        client = clientRepository.save(client);
        
        logActivity(client, "CREATED", "Client profile created");
        if (client.getOpeningBalance() != null && client.getOpeningBalance() != 0.0) {
            logActivity(client, "CLIENT_OPENING_BALANCE_SET", "Opening balance set to " + client.getOpeningBalance());
            auditLogService.logAction(email, "CLIENT_OPENING_BALANCE_SET", "Client", client.getId().toString(), "Opening balance set to " + client.getOpeningBalance() + " for " + client.getName());
        }
        
        return clientBalanceService.buildClientResponse(client, company.getCurrency());
    }

    @Transactional
    public ClientResponse updateClient(String email, Long id, ClientRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        Double oldOpeningBalance = client.getOpeningBalance();
        updateClientFromRequest(client, request);
        client = clientRepository.save(client);
        
        logActivity(client, "UPDATED", "Client details updated");
        if (!java.util.Objects.equals(oldOpeningBalance, client.getOpeningBalance())) {
            logActivity(client, "CLIENT_BALANCE_UPDATED", "Opening balance updated from " + oldOpeningBalance + " to " + client.getOpeningBalance());
            auditLogService.logAction(email, "CLIENT_BALANCE_UPDATED", "Client", client.getId().toString(), "Opening balance updated from " + oldOpeningBalance + " to " + client.getOpeningBalance() + " for " + client.getName());
        }
        
        return clientBalanceService.buildClientResponse(client, company.getCurrency());
    }

    @Transactional
    public void deleteClient(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        clientActivityRepository.deleteAll(clientActivityRepository.findByClientOrderByTimestampDesc(client));
        clientRepository.delete(client);
    }

    private void updateClientFromRequest(Client client, ClientRequest request) {
        client.setName(request.getName());
        client.setEmail(request.getEmail());
        client.setPhone(request.getPhone());
        client.setAddress(request.getAddress());
        client.setNotes(request.getNotes());
        
        if (request.getTags() != null) {
            client.getTags().clear();
            client.getTags().addAll(request.getTags());
        }
        
        if (request.getOpeningBalance() != null) {
            client.setOpeningBalance(currencyService.convertToBase(request.getOpeningBalance(), client.getCompany().getCurrency()));
        } else if (request.getOutstandingBalance() != null) {
            client.setOpeningBalance(currencyService.convertToBase(request.getOutstandingBalance(), client.getCompany().getCurrency()));
        }
    }

    @Transactional
    public InvoiceResponse generateOpeningBalanceInvoice(
            String email, 
            Long clientId, 
            GenerateOpeningBalanceInvoiceRequest request) {
        
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(clientId, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        Double openingBalance = client.getOpeningBalance();
        if (openingBalance == null || openingBalance <= 0.0) {
            throw new RuntimeException("Client has no historical opening balance to convert.");
        }

        // 1. Generate Invoice Number using company sequence
        int nextSequence = (company.getLastInvoiceSequence() == null ? 0 : company.getLastInvoiceSequence()) + 1;
        company.setLastInvoiceSequence(nextSequence);
        String prefix = company.getInvoicePrefix() != null ? company.getInvoicePrefix() : "INV-";
        String invoiceNumber = prefix + String.format("%04d", nextSequence);
        companyRepository.save(company);

        // 2. Build Invoice Entity
        com.smartledger.model.Invoice invoice = new com.smartledger.model.Invoice();
        invoice.setCompany(company);
        invoice.setClient(client);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setIssueDate(java.time.LocalDate.now());
        
        java.time.LocalDate dueDate = (request != null && request.getDueDate() != null) 
                ? request.getDueDate() 
                : java.time.LocalDate.now().plusDays(14);
        invoice.setDueDate(dueDate);
        invoice.setStatus(com.smartledger.model.InvoiceStatus.PENDING);
        
        invoice.setSubTotal(openingBalance);
        invoice.setTaxTotal(0.0);
        invoice.setDiscountTotal(0.0);
        invoice.setTotalAmount(openingBalance);

        String notes = (request != null && request.getNotes() != null && !request.getNotes().trim().isEmpty())
                ? request.getNotes().trim()
                : "Historical Opening Balance Invoice converted on onboarding.";
        invoice.setNotes(notes);

        // 3. Create Line Item
        com.smartledger.model.InvoiceItem item = new com.smartledger.model.InvoiceItem();
        item.setInvoice(invoice);
        item.setDescription("Historical Outstanding Balance");
        item.setQuantity(1);
        item.setUnitPrice(openingBalance);
        item.setTotal(openingBalance);
        invoice.addItem(item);

        // 4. Save Invoice
        invoice = invoiceRepository.save(invoice);

        // 5. MANDATORY STEP: Reset Client Opening Balance to 0.0 to prevent double-counting!
        client.setOpeningBalance(0.0);
        clientRepository.save(client);

        // 6. Log Audit Trails & Activity Logs
        logActivity(client, "OPENING_BALANCE_CONVERTED", "Opening balance of " + openingBalance + " converted to Invoice " + invoiceNumber);
        
        auditLogService.logAction(
                email, 
                "OPENING_BALANCE_INVOICE_CREATED", 
                "Invoice", 
                invoice.getId().toString(), 
                "Generated opening balance invoice " + invoiceNumber + " for " + client.getName() + " (Amount: " + openingBalance + ")"
        );
        
        auditLogService.logAction(
                email, 
                "OPENING_BALANCE_CONVERTED", 
                "Client", 
                client.getId().toString(), 
                "Converted historical opening balance of " + openingBalance + " into Invoice " + invoiceNumber + " for " + client.getName()
        );

        return invoiceService.mapToResponse(invoice, company);
    }

    private void logActivity(Client client, String action, String description) {
        ClientActivity activity = new ClientActivity(client, action, description);
        clientActivityRepository.save(activity);
    }
}

