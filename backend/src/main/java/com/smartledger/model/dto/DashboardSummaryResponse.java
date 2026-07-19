package com.smartledger.model.dto;

public class DashboardSummaryResponse {
    private Double totalRevenue;
    private Double totalExpenses;
    private Double netProfit;
    private Double pendingPayments;

    public DashboardSummaryResponse(Double totalRevenue, Double totalExpenses, Double pendingPayments) {
        this.totalRevenue = totalRevenue != null ? totalRevenue : 0.0;
        this.totalExpenses = totalExpenses != null ? totalExpenses : 0.0;
        this.netProfit = this.totalRevenue - this.totalExpenses;
        this.pendingPayments = pendingPayments != null ? pendingPayments : 0.0;
    }

    public Double getTotalRevenue() { return totalRevenue; }
    public Double getTotalExpenses() { return totalExpenses; }
    public Double getNetProfit() { return netProfit; }
    public Double getPendingPayments() { return pendingPayments; }
}
