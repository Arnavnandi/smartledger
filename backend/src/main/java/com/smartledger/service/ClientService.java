package com.smartledger.service;

import com.smartledger.model.Client;
import com.smartledger.model.ClientActivity;
import com.smartledger.model.Company;
import com.smartledger.model.dto.ClientActivityResponse;
import com.smartledger.model.dto.ClientRequest;
import com.smartledger.model.dto.ClientResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.repository.ClientActivityRepository;
import com.smartledger.repository.ClientRepository;
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
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;
    private final ClientBalanceService clientBalanceService;
    private final AuditLogService auditLogService;

    public ClientService(ClientRepository clientRepository, 
                         ClientActivityRepository clientActivityRepository, 
                         AuthContextService authContextService,
                         CurrencyService currencyService,
                         ClientBalanceService clientBalanceService,
                         AuditLogService auditLogService) {
        this.clientRepository = clientRepository;
        this.clientActivityRepository = clientActivityRepository;
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

    private void logActivity(Client client, String action, String description) {
        ClientActivity activity = new ClientActivity(client, action, description);
        clientActivityRepository.save(activity);
    }
}

