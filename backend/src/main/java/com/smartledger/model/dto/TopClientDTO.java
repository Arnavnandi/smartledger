package com.smartledger.model.dto;

public class TopClientDTO {
    private Long clientId;
    private String clientName;
    private Double totalRevenue;

    public TopClientDTO(Long clientId, String clientName, Double totalRevenue) {
        this.clientId = clientId;
        this.clientName = clientName;
        this.totalRevenue = totalRevenue != null ? totalRevenue : 0.0;
    }

    public Long getClientId() { return clientId; }
    public String getClientName() { return clientName; }
    public Double getTotalRevenue() { return totalRevenue; }
}
