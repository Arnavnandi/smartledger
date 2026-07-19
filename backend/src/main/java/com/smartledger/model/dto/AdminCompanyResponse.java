package com.smartledger.model.dto;

import com.smartledger.model.Company;

public class AdminCompanyResponse {
    private Long id;
    private String name;
    private String ownerEmail;

    public AdminCompanyResponse(Company company) {
        this.id = company.getId();
        this.name = company.getName();
        this.ownerEmail = company.getOwner() != null ? company.getOwner().getEmail() : null;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getOwnerEmail() { return ownerEmail; }
}
