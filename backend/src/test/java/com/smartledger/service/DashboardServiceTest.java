package com.smartledger.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.Invoice;
import com.smartledger.model.dto.ChartDataPoint;
import com.smartledger.model.dto.DashboardSummaryResponse;
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

class DashboardServiceTest {

    private InvoiceRepository invoiceRepository;
    private ExpenseRepository expenseRepository;
    private AiService aiService;
    private AuthContextService authContextService;
    private CurrencyService currencyService;
    private DashboardService dashboardService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        invoiceRepository = Mockito.mock(InvoiceRepository.class);
        expenseRepository = Mockito.mock(ExpenseRepository.class);
        aiService = Mockito.mock(AiService.class);
        authContextService = Mockito.mock(AuthContextService.class);
        currencyService = Mockito.mock(CurrencyService.class);
        objectMapper = new ObjectMapper();

        dashboardService = new DashboardService(
                invoiceRepository, expenseRepository, aiService, authContextService, currencyService
        );

        Company company = new Company();
        company.setId(1L);
        company.setName("Test Business");
        company.setCurrency("INR");

        Mockito.when(authContextService.getAuthenticatedUserCompany(any())).thenReturn(company);

        // Mock CurrencyService to return identity
        Mockito.when(currencyService.convertToDisplay(any(Double.class), any())).thenAnswer(invocation -> invocation.getArgument(0));
        Mockito.when(currencyService.convertToDisplay(any(BigDecimal.class), any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testGetCashFlowWithExpensesAndInvoices() throws Exception {
        Company company = authContextService.getAuthenticatedUserCompany("test@example.com");

        // Mock invoice
        Invoice invoice = new Invoice();
        invoice.setTotalAmount(1424201.00);
        invoice.setIssueDate(LocalDate.now());
        Mockito.when(invoiceRepository.findPaidInvoicesSince(eq(company), any())).thenReturn(List.of(invoice));

        // Mock expense
        Expense expense = new Expense();
        expense.setVendorName("AWS Cloud Services");
        expense.setAmount(new BigDecimal("70501.44"));
        expense.setExpenseDate(LocalDate.now());
        Mockito.when(expenseRepository.findAllByCompany(eq(company))).thenReturn(List.of(expense));

        List<ChartDataPoint> points = dashboardService.getCashFlow("test@example.com", 6);
        String jsonResult = objectMapper.writeValueAsString(points);

        System.out.println("=== ANALYTICS API CASH-FLOW RESPONSE JSON ===");
        System.out.println(jsonResult);

        assertNotNull(points);
        assertFalse(points.isEmpty());
        ChartDataPoint lastPoint = points.get(points.size() - 1);
        assertEquals(1424201.00, lastPoint.getRevenue());
        assertEquals(70501.44, lastPoint.getExpense());
    }

    @Test
    void testGetSummary() throws Exception {
        Company company = authContextService.getAuthenticatedUserCompany("test@example.com");
        Mockito.when(invoiceRepository.sumPaidRevenue(company)).thenReturn(1424201.00);
        Mockito.when(expenseRepository.sumTotalExpenses(company)).thenReturn(new BigDecimal("70501.44"));
        Mockito.when(invoiceRepository.sumPendingRevenue(company)).thenReturn(0.00);

        DashboardSummaryResponse summary = dashboardService.getSummary("test@example.com");
        String jsonResult = objectMapper.writeValueAsString(summary);

        System.out.println("=== ANALYTICS API SUMMARY RESPONSE JSON ===");
        System.out.println(jsonResult);

        assertEquals(1424201.00, summary.getTotalRevenue());
        assertEquals(70501.44, summary.getTotalExpenses());
    }
}
