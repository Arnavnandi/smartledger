package com.smartledger.model.dto;

import com.smartledger.model.Client;

import java.time.LocalDateTime;
import java.util.List;

public class ClientResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String notes;
    private List<String> tags;
    private Double openingBalance;
    private Double outstandingDue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ClientResponse(Client client) {
        this.id = client.getId();
        this.name = client.getName();
        this.email = client.getEmail();
        this.phone = client.getPhone();
        this.address = client.getAddress();
        this.notes = client.getNotes();
        this.tags = client.getTags();
        this.openingBalance = client.getOpeningBalance();
        this.outstandingDue = client.getOpeningBalance(); // Default; overridden by ClientBalanceService
        this.createdAt = client.getCreatedAt();
        this.updatedAt = client.getUpdatedAt();
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getNotes() { return notes; }
    public List<String> getTags() { return tags; }

    public Double getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(Double openingBalance) { this.openingBalance = openingBalance; }

    public Double getOutstandingDue() { return outstandingDue; }
    public void setOutstandingDue(Double outstandingDue) { this.outstandingDue = outstandingDue; }

    // Backward compatibility: frontend still reads outstandingBalance
    public Double getOutstandingBalance() { return outstandingDue; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

