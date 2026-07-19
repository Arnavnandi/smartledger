package com.smartledger.controller;

import com.smartledger.model.dto.ApiResponse;
import com.smartledger.model.dto.ExpenseRequest;
import com.smartledger.model.dto.ExpenseResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("Not authenticated");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ExpenseResponse>> getExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "expenseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        String email = getAuthenticatedUserEmail();
        Sort.Direction dir = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sortBy));
        
        return ResponseEntity.ok(expenseService.getExpenses(email, search, categoryId, pageable));
    }

    @PostMapping("/search")
    public ResponseEntity<PaginatedResponse<ExpenseResponse>> searchExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestBody com.smartledger.model.dto.ExpenseFilterRequest filter) {
        return ResponseEntity.ok(expenseService.searchExpenses(getAuthenticatedUserEmail(), filter, PageRequest.of(page, size, Sort.by("expenseDate").descending())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseResponse> getExpense(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(expenseService.getExpenseById(email, id));
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(@Valid @RequestBody ExpenseRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(expenseService.saveExpense(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponse> updateExpense(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(expenseService.updateExpense(email, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteExpense(@PathVariable Long id) {
        String email = getAuthenticatedUserEmail();
        expenseService.deleteExpense(email, id);
        return ResponseEntity.ok(new ApiResponse(true, "Expense deleted successfully"));
    }

    @PostMapping("/upload")
    public ResponseEntity<ExpenseRequest> uploadAndParseReceipt(@RequestParam("file") MultipartFile file) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(expenseService.uploadAndParseReceipt(email, file));
    }
}
