package com.smartledger.model.dto;

import com.smartledger.model.Invoice;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long clientId;
    private String clientName;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private String status;
    private Double subTotal;
    private Double taxTotal;
    private Double discountTotal;
    private Double totalAmount;
    private String notes;
    private String terms;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InvoiceItemResponse> items;

    public InvoiceResponse(Invoice invoice) {
        this.id = invoice.getId();
        this.invoiceNumber = invoice.getInvoiceNumber();
        this.clientId = invoice.getClient().getId();
        this.clientName = invoice.getClient().getName();
        this.issueDate = invoice.getIssueDate();
        this.dueDate = invoice.getDueDate();
        this.status = invoice.getStatus().name();
        this.subTotal = invoice.getSubTotal();
        this.taxTotal = invoice.getTaxTotal();
        this.discountTotal = invoice.getDiscountTotal();
        this.totalAmount = invoice.getTotalAmount();
        this.notes = invoice.getNotes();
        this.terms = invoice.getTerms();
        this.createdAt = invoice.getCreatedAt();
        this.updatedAt = invoice.getUpdatedAt();
        
        if (invoice.getItems() != null) {
            this.items = invoice.getItems().stream()
                    .map(InvoiceItemResponse::new)
                    .collect(Collectors.toList());
        }
    }

    // Getters
    public Long getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public Long getClientId() { return clientId; }
    public String getClientName() { return clientName; }
    public LocalDate getIssueDate() { return issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public String getStatus() { return status; }
    public Double getSubTotal() { return subTotal; }
    public void setSubTotal(Double subTotal) { this.subTotal = subTotal; }
    public Double getTaxTotal() { return taxTotal; }
    public void setTaxTotal(Double taxTotal) { this.taxTotal = taxTotal; }
    public Double getDiscountTotal() { return discountTotal; }
    public void setDiscountTotal(Double discountTotal) { this.discountTotal = discountTotal; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getNotes() { return notes; }
    public String getTerms() { return terms; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<InvoiceItemResponse> getItems() { return items; }
}
