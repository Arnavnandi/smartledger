package com.smartledger.controller;

import com.smartledger.model.dto.ApiResponse;
import com.smartledger.model.dto.ClientActivityResponse;
import com.smartledger.model.dto.ClientRequest;
import com.smartledger.model.dto.ClientResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("Not authenticated");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ClientResponse>> getClients(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        String email = getAuthenticatedUserEmail();
        Sort.Direction dir = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        
        return ResponseEntity.ok(clientService.getClients(email, search, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClientResponse> getClient(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(clientService.getClientById(email, id));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<List<ClientActivityResponse>> getClientActivity(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(clientService.getClientActivity(email, id));
    }

    @PostMapping
    public ResponseEntity<ClientResponse> createClient(@Valid @RequestBody ClientRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(clientService.createClient(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClientResponse> updateClient(@PathVariable Long id, @Valid @RequestBody ClientRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(clientService.updateClient(email, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteClient(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        clientService.deleteClient(email, id);
        return ResponseEntity.ok(new ApiResponse(true, "Client deleted successfully"));
    }
}
