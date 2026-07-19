package com.smartledger.service;

import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.Invoice;
import com.smartledger.model.User;
import com.smartledger.model.dto.ChartDataPoint;
import com.smartledger.model.dto.DashboardSummaryResponse;
import com.smartledger.model.dto.TopClientDTO;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.InvoiceRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;
    private final AiService aiService;
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;

    public DashboardService(InvoiceRepository invoiceRepository, 
                            ExpenseRepository expenseRepository, 
                            AiService aiService,
                            AuthContextService authContextService,
                            CurrencyService currencyService) {
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.aiService = aiService;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(String email) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Double totalRevenue = currencyService.convertToDisplay(invoiceRepository.sumPaidRevenue(company), company.getCurrency());
        java.math.BigDecimal totalExpensesBd = expenseRepository.sumTotalExpenses(company);
        Double totalExpenses = currencyService.convertToDisplay(totalExpensesBd != null ? totalExpensesBd.doubleValue() : 0.0, company.getCurrency());
        Double pendingPayments = currencyService.convertToDisplay(invoiceRepository.sumPendingRevenue(company), company.getCurrency());
        
        return new DashboardSummaryResponse(totalRevenue, totalExpenses, pendingPayments);
    }

    @Transactional(readOnly = true)
    public List<TopClientDTO> getTopClients(String email, int limit) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        List<TopClientDTO> clients = invoiceRepository.findTopClients(company, PageRequest.of(0, limit));
        return clients.stream()
            .map(c -> new TopClientDTO(c.getClientId(), c.getClientName(), currencyService.convertToDisplay(c.getTotalRevenue(), company.getCurrency())))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChartDataPoint> getCashFlow(String email, int months) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        LocalDate startDate = LocalDate.now().minusMonths(months - 1).withDayOfMonth(1);
        
        List<Invoice> recentInvoices = invoiceRepository.findPaidInvoicesSince(company, startDate);
        List<Expense> recentExpenses = expenseRepository.findExpensesSince(company, startDate);

        // Group by YYYY-MM
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        Map<String, ChartDataPoint> dataMap = new LinkedHashMap<>();
        
        // Initialize all months
        for (int i = months - 1; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusMonths(i);
            String label = d.format(formatter);
            dataMap.put(label, new ChartDataPoint(label, 0.0, 0.0));
        }

        // Aggregate Revenue
        for (Invoice inv : recentInvoices) {
            String label = inv.getIssueDate().format(formatter);
            if (dataMap.containsKey(label)) {
                ChartDataPoint pt = dataMap.get(label);
                dataMap.put(label, new ChartDataPoint(label, pt.getRevenue() + inv.getTotalAmount(), pt.getExpense()));
            }
        }

        // Aggregate Expenses
        for (Expense exp : recentExpenses) {
            String label = exp.getExpenseDate().format(formatter);
            if (dataMap.containsKey(label)) {
                ChartDataPoint pt = dataMap.get(label);
                dataMap.put(label, new ChartDataPoint(label, pt.getRevenue(), pt.getExpense() + exp.getAmount().doubleValue()));
            }
        }

        return dataMap.values().stream().map(pt -> new ChartDataPoint(
            pt.getMonth(), 
            currencyService.convertToDisplay(pt.getRevenue(), company.getCurrency()), 
            currencyService.convertToDisplay(pt.getExpense(), company.getCurrency())
        )).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String getFinancialInsights(String email) {
        DashboardSummaryResponse summary = getSummary(email);
        com.smartledger.model.Company company = authContextService.getAuthenticatedUserCompany(email);
        String currency = company.getCurrency() != null ? company.getCurrency() : "INR";
        
        // Pass summary data to AI Service
        String summaryData = String.format(
            "Total Revenue: %s%.2f, Total Expenses: %s%.2f, Net Profit: %s%.2f, Pending Payments (Outstanding): %s%.2f",
            currency, summary.getTotalRevenue(), currency, summary.getTotalExpenses(), currency, summary.getNetProfit(), currency, summary.getPendingPayments()
        );
        
        return aiService.generateFinancialInsights(summaryData);
    }
}
