package com.smartledger.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.Invoice;
import com.smartledger.model.dto.ReportSummaryResponse;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

class ReportServiceTest {

    private InvoiceRepository invoiceRepository;
    private ExpenseRepository expenseRepository;
    private AuthContextService authContextService;
    private CurrencyService currencyService;
    private ReportService reportService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        invoiceRepository = Mockito.mock(InvoiceRepository.class);
        expenseRepository = Mockito.mock(ExpenseRepository.class);
        authContextService = Mockito.mock(AuthContextService.class);
        currencyService = Mockito.mock(CurrencyService.class);
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());

        reportService = new ReportService(
                invoiceRepository, expenseRepository, authContextService, currencyService, objectMapper
        );

        Company company = new Company();
        company.setId(1L);
        company.setName("Test Business");
        company.setCurrency("INR");

        Mockito.when(authContextService.getAuthenticatedUserCompany(any())).thenReturn(company);
        Mockito.when(currencyService.convertToDisplay(any(Double.class), any())).thenAnswer(invocation -> invocation.getArgument(0));
        Mockito.when(currencyService.convertToDisplay(any(BigDecimal.class), any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testMonthlyReportJson() throws Exception {
        Company company = authContextService.getAuthenticatedUserCompany("test@example.com");

        Expense expense = new Expense();
        expense.setId(10L);
        expense.setVendorName("AWS");
        expense.setAmount(new BigDecimal("70501.44"));
        expense.setExpenseDate(LocalDate.of(2026, 7, 15));
        expense.setCompany(company);

        Mockito.when(expenseRepository.findAllByCompany(eq(company))).thenReturn(List.of(expense));
        Mockito.when(invoiceRepository.findAll()).thenReturn(List.of());

        ReportSummaryResponse response = reportService.generateMonthlyReport("test@example.com", 2026, 7);
        String jsonResult = objectMapper.writeValueAsString(response);

        System.out.println("=== ANALYTICS MONTHLY REPORT JSON ===");
        System.out.println(jsonResult);

        assertEquals(70501.44, response.getTotalExpenses());
        assertFalse(response.getBreakdown().isEmpty());
    }

    @Test
    void testYearlyReportJson() throws Exception {
        Company company = authContextService.getAuthenticatedUserCompany("test@example.com");

        Expense expense = new Expense();
        expense.setId(10L);
        expense.setVendorName("AWS");
        expense.setAmount(new BigDecimal("70501.44"));
        expense.setExpenseDate(LocalDate.of(2026, 7, 15));
        expense.setCompany(company);

        Mockito.when(expenseRepository.findAllByCompany(eq(company))).thenReturn(List.of(expense));
        Mockito.when(invoiceRepository.findAll()).thenReturn(List.of());

        ReportSummaryResponse response = reportService.generateYearlyReport("test@example.com", 2026);
        String jsonResult = objectMapper.writeValueAsString(response);

        System.out.println("=== ANALYTICS YEARLY REPORT JSON ===");
        System.out.println(jsonResult);

        assertEquals(70501.44, response.getTotalExpenses());
        assertFalse(response.getBreakdown().isEmpty());
    }
}
