package com.smartledger.model.dto;

import java.util.List;
import java.util.Map;

public class ReportSummaryResponse {
    private String period; // e.g., "Monthly: Jan 2026", "Yearly: 2026"
    private double totalRevenue;
    private double totalExpenses;
    private double netProfit;
    
    // For breakdown (e.g., by week or by month)
    private List<ChartDataPoint> breakdown;
    
    // Details
    private List<InvoiceResponse> topInvoices;
    private List<ExpenseResponse> topExpenses;

    public ReportSummaryResponse(String period, double totalRevenue, double totalExpenses, double netProfit, List<ChartDataPoint> breakdown, List<InvoiceResponse> topInvoices, List<ExpenseResponse> topExpenses) {
        this.period = period;
        this.totalRevenue = totalRevenue;
        this.totalExpenses = totalExpenses;
        this.netProfit = netProfit;
        this.breakdown = breakdown;
        this.topInvoices = topInvoices;
        this.topExpenses = topExpenses;
    }

    public String getPeriod() { return period; }
    public double getTotalRevenue() { return totalRevenue; }
    public double getTotalExpenses() { return totalExpenses; }
    public double getNetProfit() { return netProfit; }
    public List<ChartDataPoint> getBreakdown() { return breakdown; }
    public List<InvoiceResponse> getTopInvoices() { return topInvoices; }
    public List<ExpenseResponse> getTopExpenses() { return topExpenses; }
}
