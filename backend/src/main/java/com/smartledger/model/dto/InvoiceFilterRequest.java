package com.smartledger.model.dto;

import java.time.LocalDate;

public class InvoiceFilterRequest {
    private String search;
    private String status;
    private Long clientId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double minAmount;
    private Double maxAmount;

    // Getters and Setters
    public String getSearch() { return search; }
    public void setSearch(String search) { this.search = search; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getClientId() { return clientId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Double getMinAmount() { return minAmount; }
    public void setMinAmount(Double minAmount) { this.minAmount = minAmount; }

    public Double getMaxAmount() { return maxAmount; }
    public void setMaxAmount(Double maxAmount) { this.maxAmount = maxAmount; }
}
