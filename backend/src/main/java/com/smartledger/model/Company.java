package com.smartledger.model;

import jakarta.persistence.*;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String gstNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column
    private String logoUrl;

    @Column
    private String currency = "INR"; // Default

    @Column
    private Double taxRate = 0.0; // Default

    @Column
    private String invoicePrefix = "INV-"; // Default

    @Column
    private Integer lastInvoiceSequence = 0;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private User owner;

    public Company() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; }
    
    public String getInvoicePrefix() { return invoicePrefix; }
    public void setInvoicePrefix(String invoicePrefix) { this.invoicePrefix = invoicePrefix; }

    public Integer getLastInvoiceSequence() { return lastInvoiceSequence; }
    public void setLastInvoiceSequence(Integer lastInvoiceSequence) { this.lastInvoiceSequence = lastInvoiceSequence; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
}
