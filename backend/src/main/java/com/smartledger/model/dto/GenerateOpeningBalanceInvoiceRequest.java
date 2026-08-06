package com.smartledger.model.dto;

import java.time.LocalDate;

public class GenerateOpeningBalanceInvoiceRequest {
    
    private LocalDate dueDate;
    private String notes;

    public GenerateOpeningBalanceInvoiceRequest() {}

    public GenerateOpeningBalanceInvoiceRequest(LocalDate dueDate, String notes) {
        this.dueDate = dueDate;
        this.notes = notes;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
