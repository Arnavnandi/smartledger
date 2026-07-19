package com.smartledger.model.dto;

public class ChartDataPoint {
    private String month;
    private Double revenue;
    private Double expense;

    public ChartDataPoint(String month, Double revenue, Double expense) {
        this.month = month;
        this.revenue = revenue != null ? revenue : 0.0;
        this.expense = expense != null ? expense : 0.0;
    }

    public String getMonth() { return month; }
    public Double getRevenue() { return revenue; }
    public Double getExpense() { return expense; }
}
