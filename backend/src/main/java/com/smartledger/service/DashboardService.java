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

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);
        Map<String, double[]> monthlyTotals = new LinkedHashMap<>();
        
        // Initialize 6 months in chronological order
        for (int i = months - 1; i >= 0; i--) {
            java.time.YearMonth ym = java.time.YearMonth.now().minusMonths(i);
            String label = ym.format(formatter);
            monthlyTotals.put(label, new double[]{0.0, 0.0});
        }

        // Aggregate Revenue from paid invoices
        if (recentInvoices != null) {
            for (Invoice inv : recentInvoices) {
                LocalDate date = inv.getIssueDate();
                if (date != null) {
                    String label = date.format(formatter);
                    if (monthlyTotals.containsKey(label)) {
                        double total = inv.getTotalAmount() != null ? inv.getTotalAmount() : 0.0;
                        monthlyTotals.get(label)[0] += total;
                    }
                }
            }
        }

        // Aggregate Expenses
        if (recentExpenses != null) {
            for (Expense exp : recentExpenses) {
                LocalDate date = exp.getExpenseDate() != null 
                        ? exp.getExpenseDate() 
                        : (exp.getCreatedAt() != null ? exp.getCreatedAt().toLocalDate() : LocalDate.now());
                String label = date.format(formatter);
                if (monthlyTotals.containsKey(label)) {
                    double amt = exp.getAmount() != null ? exp.getAmount().doubleValue() : 0.0;
                    monthlyTotals.get(label)[1] += amt;
                }
            }
        }

        List<ChartDataPoint> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : monthlyTotals.entrySet()) {
            String month = entry.getKey();
            Double revInr = entry.getValue()[0];
            Double expInr = entry.getValue()[1];
            
            Double revDisplay = currencyService.convertToDisplay(revInr, company.getCurrency());
            Double expDisplay = currencyService.convertToDisplay(expInr, company.getCurrency());
            
            result.add(new ChartDataPoint(month, revDisplay, expDisplay));
        }

        return result;
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
