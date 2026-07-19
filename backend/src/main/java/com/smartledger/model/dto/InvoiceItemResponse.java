package com.smartledger.model.dto;

import com.smartledger.model.InvoiceItem;

public class InvoiceItemResponse {
    private Long id;
    private String description;
    private Integer quantity;
    private Double unitPrice;
    private Double taxRate;
    private Double discount;
    private Double total;

    public InvoiceItemResponse(InvoiceItem item) {
        this.id = item.getId();
        this.description = item.getDescription();
        this.quantity = item.getQuantity();
        this.unitPrice = item.getUnitPrice();
        this.taxRate = item.getTaxRate();
        this.discount = item.getDiscount();
        this.total = item.getTotal();
    }

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public Integer getQuantity() { return quantity; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public Double getTaxRate() { return taxRate; }
    public Double getDiscount() { return discount; }
    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
}
