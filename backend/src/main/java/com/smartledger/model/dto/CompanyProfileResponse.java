package com.smartledger.model.dto;

import com.smartledger.model.Company;

public class CompanyProfileResponse {

    private Long id;
    private String name;
    private String gstNumber;
    private String address;
    private String logoUrl;
    private String currency;
    private Double taxRate;
    private String invoicePrefix;

    public CompanyProfileResponse(Company company) {
        this.id = company.getId();
        this.name = company.getName();
        this.gstNumber = company.getGstNumber();
        this.address = company.getAddress();
        this.logoUrl = company.getLogoUrl();
        this.currency = company.getCurrency();
        this.taxRate = company.getTaxRate();
        this.invoicePrefix = company.getInvoicePrefix();
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getGstNumber() { return gstNumber; }
    public String getAddress() { return address; }
    public String getLogoUrl() { return logoUrl; }
    public String getCurrency() { return currency; }
    public Double getTaxRate() { return taxRate; }
    public String getInvoicePrefix() { return invoicePrefix; }
}
