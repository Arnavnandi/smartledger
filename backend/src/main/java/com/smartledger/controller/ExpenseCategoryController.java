package com.smartledger.controller;

import com.smartledger.model.dto.ApiResponse;
import com.smartledger.model.dto.ExpenseCategoryRequest;
import com.smartledger.model.dto.ExpenseCategoryResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.ExpenseCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expense-categories")
public class ExpenseCategoryController {

    private final ExpenseCategoryService categoryService;

    public ExpenseCategoryController(ExpenseCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping
    public ResponseEntity<List<ExpenseCategoryResponse>> getCategories() {
        return ResponseEntity.ok(categoryService.getCategories(getAuthenticatedUserEmail()));
    }

    @PostMapping
    public ResponseEntity<ExpenseCategoryResponse> createCategory(@Valid @RequestBody ExpenseCategoryRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(categoryService.createCategory(email, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseCategoryResponse> updateCategory(@PathVariable Long id, @Valid @RequestBody ExpenseCategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(getAuthenticatedUserEmail(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(getAuthenticatedUserEmail(), id);
        return ResponseEntity.ok(new ApiResponse(true, "Category deleted"));
    }
}
