package com.smartledger.model.dto;

import java.time.LocalDate;

public class ExpenseFilterRequest {
    private String search; // Vendor Name or Category Name
    private Long categoryId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double minAmount;
    private Double maxAmount;

    // Getters and Setters
    public String getSearch() { return search; }
    public void setSearch(String search) { this.search = search; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Double getMinAmount() { return minAmount; }
    public void setMinAmount(Double minAmount) { this.minAmount = minAmount; }

    public Double getMaxAmount() { return maxAmount; }
    public void setMaxAmount(Double maxAmount) { this.maxAmount = maxAmount; }
}
