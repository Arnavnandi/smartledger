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
    private Double outstandingBalance;
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
        this.outstandingBalance = client.getOutstandingBalance();
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
    public Double getOutstandingBalance() { return outstandingBalance; }
    public void setOutstandingBalance(Double outstandingBalance) { this.outstandingBalance = outstandingBalance; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
