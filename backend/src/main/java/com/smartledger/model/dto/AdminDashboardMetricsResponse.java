package com.smartledger.model.dto;

public class AdminDashboardMetricsResponse {
    private long totalUsers;
    private long totalCompanies;
    private long totalInvoices;
    private double totalPlatformRevenue;

    public AdminDashboardMetricsResponse(long totalUsers, long totalCompanies, long totalInvoices, double totalPlatformRevenue) {
        this.totalUsers = totalUsers;
        this.totalCompanies = totalCompanies;
        this.totalInvoices = totalInvoices;
        this.totalPlatformRevenue = totalPlatformRevenue;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalCompanies() { return totalCompanies; }
    public void setTotalCompanies(long totalCompanies) { this.totalCompanies = totalCompanies; }
    public long getTotalInvoices() { return totalInvoices; }
    public void setTotalInvoices(long totalInvoices) { this.totalInvoices = totalInvoices; }
    public double getTotalPlatformRevenue() { return totalPlatformRevenue; }
    public void setTotalPlatformRevenue(double totalPlatformRevenue) { this.totalPlatformRevenue = totalPlatformRevenue; }
}
