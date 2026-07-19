package com.smartledger.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.ExpenseCategory;
import com.smartledger.model.User;
import com.smartledger.model.dto.ExpenseRequest;
import com.smartledger.model.dto.ExpenseResponse;
import com.smartledger.model.dto.PaginatedResponse;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.ExpenseCategoryRepository;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseCategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;
    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;

    public ExpenseService(ExpenseRepository expenseRepository, 
                          ExpenseCategoryRepository categoryRepository,
                          FileStorageService fileStorageService,
                          AiService aiService,
                          ObjectMapper objectMapper,
                          AuthContextService authContextService,
                          CurrencyService currencyService) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.fileStorageService = fileStorageService;
        this.aiService = aiService;
        this.objectMapper = objectMapper;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
    }



    public PaginatedResponse<ExpenseResponse> getExpenses(String email, String search, Long categoryId, Pageable pageable) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Page<Expense> page;

        if (search != null && !search.trim().isEmpty()) {
            page = expenseRepository.searchByCompanyAndKeyword(company, search.trim(), pageable);
        } else {
            page = expenseRepository.findByCompany(company, pageable);
        }

        List<ExpenseResponse> responses = page.getContent().stream()
                .map(e -> {
                    ExpenseResponse res = new ExpenseResponse(e);
                    res.setAmount(currencyService.convertToDisplay(e.getAmount(), company.getCurrency()));
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

    public ExpenseResponse getExpenseById(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Expense expense = expenseRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        ExpenseResponse response = new ExpenseResponse(expense);
        response.setAmount(currencyService.convertToDisplay(expense.getAmount(), company.getCurrency()));
        return response;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ExpenseResponse> searchExpenses(String email, com.smartledger.model.dto.ExpenseFilterRequest filter, Pageable pageable) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        org.springframework.data.jpa.domain.Specification<Expense> spec = com.smartledger.specification.ExpenseSpecification.filterBy(company, filter);
        Page<Expense> page = expenseRepository.findAll(spec, pageable);
        
        List<ExpenseResponse> responses = page.getContent().stream()
                .map(e -> {
                    ExpenseResponse res = new ExpenseResponse(e);
                    res.setAmount(currencyService.convertToDisplay(e.getAmount(), company.getCurrency()));
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

    @Transactional
    public ExpenseResponse saveExpense(String email, ExpenseRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Expense expense = new Expense();
        expense.setCompany(company);
        
        updateExpenseFromRequest(expense, company, request);
        checkDuplicates(expense, company, null);

        // Auto-set the next recurring date if it's recurring and doesn't have one
        if (expense.getRecurringFrequency() != com.smartledger.model.RecurringFrequency.NONE && expense.getNextRecurringDate() == null) {
            expense.setNextRecurringDate(calculateNextDate(expense.getExpenseDate(), expense.getRecurringFrequency()));
        }

        expense = expenseRepository.save(expense);
        ExpenseResponse response = new ExpenseResponse(expense);
        response.setAmount(currencyService.convertToDisplay(expense.getAmount(), company.getCurrency()));
        return response;
    }

    @Transactional
    public ExpenseResponse updateExpense(String email, Long id, ExpenseRequest request) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Expense expense = expenseRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        updateExpenseFromRequest(expense, company, request);
        checkDuplicates(expense, company, id);

        if (expense.getRecurringFrequency() != com.smartledger.model.RecurringFrequency.NONE && expense.getNextRecurringDate() == null) {
            expense.setNextRecurringDate(calculateNextDate(expense.getExpenseDate(), expense.getRecurringFrequency()));
        } else if (expense.getRecurringFrequency() == com.smartledger.model.RecurringFrequency.NONE) {
            expense.setNextRecurringDate(null);
        }

        expense = expenseRepository.save(expense);
        ExpenseResponse response = new ExpenseResponse(expense);
        response.setAmount(currencyService.convertToDisplay(expense.getAmount(), company.getCurrency()));
        return response;
    }

    @Transactional
    public void deleteExpense(String email, Long id) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        Expense expense = expenseRepository.findByIdAndCompany(id, company)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        expenseRepository.delete(expense);
    }

    public ExpenseRequest uploadAndParseReceipt(String email, MultipartFile file) {
        Company company = authContextService.getAuthenticatedUserCompany(email); // Auth check
        
        // 1. Store the file securely
        String fileUrl = fileStorageService.storeFile(file);
        
        // 2. Pass the file to Gemini AI for Multi-modal parsing
        try {
            byte[] imageBytes = file.getBytes();
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            String jsonResult = aiService.extractReceiptData(imageBytes, mimeType);
            
            System.out.println("Gemini JSON Response: " + jsonResult);
            
            if (jsonResult == null || jsonResult.trim().isEmpty() || jsonResult.contains("\"error\"")) {
                throw new RuntimeException("Gemini returned invalid response: " + jsonResult);
            }

            // 3. Parse JSON into ExpenseRequest
            objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            ExpenseRequest request = objectMapper.readValue(jsonResult, ExpenseRequest.class);
            request.setReceiptUrl(fileUrl);
            return request;
        } catch (Exception e) {
            System.err.println("Failed to parse Gemini response: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("AI Receipt parsing failed: " + e.getMessage(), e);
        }
    }

    private void updateExpenseFromRequest(Expense expense, Company company, ExpenseRequest request) {
        expense.setVendorName(request.getVendorName());
        expense.setAmount(currencyService.convertToBase(request.getAmount(), company.getCurrency()));
        expense.setExpenseDate(request.getExpenseDate());
        
        if (request.getCategoryId() != null) {
            ExpenseCategory category = categoryRepository.findByIdAndCompany(request.getCategoryId(), company)
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            expense.setCategory(category);
        } else {
            expense.setCategory(null);
        }

        expense.setDescription(request.getDescription());
        expense.setReceiptUrl(request.getReceiptUrl());
        expense.setRecurringFrequency(request.getRecurringFrequency());
    }

    public LocalDate calculateNextDate(LocalDate fromDate, com.smartledger.model.RecurringFrequency frequency) {
        if (fromDate == null) return null;
        switch (frequency) {
            case WEEKLY: return fromDate.plusWeeks(1);
            case MONTHLY: return fromDate.plusMonths(1);
            case YEARLY: return fromDate.plusYears(1);
            default: return null;
        }
    }

    private void checkDuplicates(Expense expense, Company company, Long excludeId) {
        // Business Rule: Same Vendor, Same Amount, Date within +/- 2 days
        List<Expense> potentialDuplicates = expenseRepository.findPotentialDuplicates(
                company, 
                expense.getVendorName(), 
                expense.getAmount(), 
                expense.getExpenseDate().minusDays(2), 
                expense.getExpenseDate().plusDays(2), 
                excludeId != null ? excludeId : -1L
        );

        if (!potentialDuplicates.isEmpty()) {
            expense.setIsDuplicate(true);
            String currency = company.getCurrency() != null ? company.getCurrency() : "INR";
            expense.setDuplicateReason("Potential duplicate found for Vendor: " + expense.getVendorName() + " with Amount: " + currencyService.convertToDisplay(expense.getAmount(), currency) + " " + currency + " around this date.");
        } else {
            expense.setIsDuplicate(false);
            expense.setDuplicateReason(null);
        }
    }
}
