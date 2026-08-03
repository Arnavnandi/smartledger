package com.smartledger.model.dto;

import java.util.List;

public class AiAutofillInvoiceResponse {
    private String clientName;
    private String issueDate;
    private String dueDate;
    private List<AiAutofillItem> items;
    private String notes;
    private String terms;

    public static class AiAutofillItem {
        private String description;
        private Double quantity;
        private Double price;
        private Double taxPercent;
        private Double discountPercent;

        public AiAutofillItem() {}

        public AiAutofillItem(String description, Double quantity, Double price, Double taxPercent, Double discountPercent) {
            this.description = description;
            this.quantity = quantity != null ? quantity : 1.0;
            this.price = price != null ? price : 0.0;
            this.taxPercent = taxPercent != null ? taxPercent : 0.0;
            this.discountPercent = discountPercent != null ? discountPercent : 0.0;
        }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Double getQuantity() { return quantity != null ? quantity : 1.0; }
        public void setQuantity(Double quantity) { this.quantity = quantity; }

        public Double getPrice() { return price != null ? price : 0.0; }
        public void setPrice(Double price) { this.price = price; }

        public Double getTaxPercent() { return taxPercent != null ? taxPercent : 0.0; }
        public void setTaxPercent(Double taxPercent) { this.taxPercent = taxPercent; }

        public Double getDiscountPercent() { return discountPercent != null ? discountPercent : 0.0; }
        public void setDiscountPercent(Double discountPercent) { this.discountPercent = discountPercent; }
    }

    public AiAutofillInvoiceResponse() {}

    public AiAutofillInvoiceResponse(String clientName, String issueDate, String dueDate, List<AiAutofillItem> items, String notes, String terms) {
        this.clientName = clientName;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.items = items;
        this.notes = notes;
        this.terms = terms;
    }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getIssueDate() { return issueDate; }
    public void setIssueDate(String issueDate) { this.issueDate = issueDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public List<AiAutofillItem> getItems() { return items; }
    public void setItems(List<AiAutofillItem> items) { this.items = items; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getTerms() { return terms; }
    public void setTerms(String terms) { this.terms = terms; }
}
