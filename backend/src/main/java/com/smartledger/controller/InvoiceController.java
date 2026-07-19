package com.smartledger.controller;

import com.smartledger.model.dto.*;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.InvoiceService;
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
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("Not authenticated");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<InvoiceResponse>> getInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(invoiceService.getInvoices(getAuthenticatedUserEmail(), search, status, PageRequest.of(page, size, Sort.by("issueDate").descending())));
    }

    @PostMapping("/search")
    public ResponseEntity<PaginatedResponse<InvoiceResponse>> searchInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestBody com.smartledger.model.dto.InvoiceFilterRequest filter) {
        return ResponseEntity.ok(invoiceService.searchInvoices(getAuthenticatedUserEmail(), filter, PageRequest.of(page, size, Sort.by("issueDate").descending())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoice(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(invoiceService.getInvoiceById(email, id));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<List<InvoiceActivityResponse>> getInvoiceActivity(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(invoiceService.getInvoiceActivity(email, id));
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(invoiceService.createInvoice(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoiceResponse> updateInvoice(@PathVariable Long id, @Valid @RequestBody InvoiceRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(invoiceService.updateInvoice(email, id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InvoiceResponse> updateInvoiceStatus(@PathVariable Long id, @Valid @RequestBody InvoiceStatusUpdateRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(invoiceService.updateInvoiceStatus(email, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteInvoice(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        invoiceService.deleteInvoice(email, id);
        return ResponseEntity.ok(new ApiResponse(true, "Invoice deleted successfully"));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        byte[] pdf = invoiceService.getInvoicePdf(email, id);
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "invoice_" + id + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");
        
        return new ResponseEntity<>(pdf, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse> sendInvoiceEmail(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        invoiceService.sendInvoiceEmail(email, id);
        return ResponseEntity.ok(new ApiResponse(true, "Invoice sent successfully"));
    }
}
