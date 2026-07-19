package com.smartledger.service;

import com.smartledger.model.Company;
import com.smartledger.model.ExpenseCategory;
import com.smartledger.model.User;
import com.smartledger.model.dto.ExpenseCategoryRequest;
import com.smartledger.model.dto.ExpenseCategoryResponse;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.ExpenseCategoryRepository;
import com.smartledger.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseCategoryService {

    private final ExpenseCategoryRepository categoryRepository;
    private final AuthContextService authContextService;

    public ExpenseCategoryService(ExpenseCategoryRepository categoryRepository,
                                  AuthContextService authContextService) {
        this.categoryRepository = categoryRepository;
        this.authContextService = authContextService;
    }



    public List<ExpenseCategoryResponse> getCategories(String email) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        return categoryRepository.findByCompanyOrderByNameAsc(company).stream()
                .map(ExpenseCategoryResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExpenseCategoryResponse createCategory(String email, ExpenseCategoryRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        if (categoryRepository.existsByCompanyAndNameIgnoreCase(company, request.getName())) {
            throw new RuntimeException("Category already exists");
        }

        ExpenseCategory category = new ExpenseCategory(company, request.getName(), request.getColor());
        category = categoryRepository.save(category);
        return new ExpenseCategoryResponse(category);
    }

    @Transactional
    public ExpenseCategoryResponse updateCategory(String email, Long id, ExpenseCategoryRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        ExpenseCategory category = categoryRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getName().equalsIgnoreCase(request.getName()) && 
            categoryRepository.existsByCompanyAndNameIgnoreCase(company, request.getName())) {
            throw new RuntimeException("Category with this name already exists");
        }

        category.setName(request.getName());
        category.setColor(request.getColor());
        category = categoryRepository.save(category);
        return new ExpenseCategoryResponse(category);
    }

    @Transactional
    public void deleteCategory(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        ExpenseCategory category = categoryRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        
        // In a real system, you might prevent deletion if there are expenses attached, 
        // or set the expenses' category_id to null before deleting.
        categoryRepository.delete(category);
    }

    // Call this when a Company is first created
    @Transactional
    public void createDefaultCategories(Company company) {
        categoryRepository.save(new ExpenseCategory(company, "Office Supplies", "#3b82f6"));
        categoryRepository.save(new ExpenseCategory(company, "Software & Subscriptions", "#8b5cf6"));
        categoryRepository.save(new ExpenseCategory(company, "Travel", "#f59e0b"));
        categoryRepository.save(new ExpenseCategory(company, "Meals & Entertainment", "#10b981"));
        categoryRepository.save(new ExpenseCategory(company, "Marketing", "#ef4444"));
        categoryRepository.save(new ExpenseCategory(company, "Contractors", "#64748b"));
    }
}
