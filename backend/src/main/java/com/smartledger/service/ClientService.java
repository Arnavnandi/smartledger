package com.smartledger.service;

import com.smartledger.model.Client;
import com.smartledger.model.ClientActivity;
import com.smartledger.model.Company;
import com.smartledger.model.User;
import com.smartledger.model.dto.ClientActivityResponse;
import com.smartledger.model.dto.ClientRequest;
import com.smartledger.model.dto.ClientResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.repository.ClientActivityRepository;
import com.smartledger.repository.ClientRepository;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.UserRepository;
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

    public ClientService(ClientRepository clientRepository, 
                         ClientActivityRepository clientActivityRepository, 
                         AuthContextService authContextService,
                         CurrencyService currencyService) {
        this.clientRepository = clientRepository;
        this.clientActivityRepository = clientActivityRepository;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
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
                .map(c -> {
                    ClientResponse res = new ClientResponse(c);
                    res.setOutstandingBalance(currencyService.convertToDisplay(c.getOutstandingBalance(), company.getCurrency()));
                    return res;
                })
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
        ClientResponse response = new ClientResponse(client);
        response.setOutstandingBalance(currencyService.convertToDisplay(client.getOutstandingBalance(), company.getCurrency()));
        return response;
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
        
        ClientResponse response = new ClientResponse(client);
        response.setOutstandingBalance(currencyService.convertToDisplay(client.getOutstandingBalance(), company.getCurrency()));
        return response;
    }

    @Transactional
    public ClientResponse updateClient(String email, Long id, ClientRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        updateClientFromRequest(client, request);
        client = clientRepository.save(client);
        
        logActivity(client, "UPDATED", "Client details updated");
        
        ClientResponse response = new ClientResponse(client);
        response.setOutstandingBalance(currencyService.convertToDisplay(client.getOutstandingBalance(), company.getCurrency()));
        return response;
    }

    @Transactional
    public void deleteClient(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Client client = clientRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        // Due to foreign key constraints, we might need to delete activity logs first
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
        
        if (request.getOutstandingBalance() != null) {
            client.setOutstandingBalance(currencyService.convertToBase(request.getOutstandingBalance(), client.getCompany().getCurrency()));
        }
    }

    private void logActivity(Client client, String action, String description) {
        ClientActivity activity = new ClientActivity(client, action, description);
        clientActivityRepository.save(activity);
    }
}
