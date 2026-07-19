package com.smartledger.model.dto;

import com.smartledger.model.Expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ExpenseResponse {
    private Long id;
    private String vendorName;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private String description;
    private String receiptUrl;
    private Boolean isDuplicate;
    private String duplicateReason;
    private com.smartledger.model.RecurringFrequency recurringFrequency;
    private LocalDate nextRecurringDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ExpenseResponse(Expense expense) {
        this.id = expense.getId();
        this.vendorName = expense.getVendorName();
        this.amount = expense.getAmount();
        this.expenseDate = expense.getExpenseDate();
        if (expense.getCategory() != null) {
            this.categoryId = expense.getCategory().getId();
            this.categoryName = expense.getCategory().getName();
            this.categoryColor = expense.getCategory().getColor();
        }
        this.description = expense.getDescription();
        this.receiptUrl = expense.getReceiptUrl();
        this.isDuplicate = expense.getIsDuplicate();
        this.duplicateReason = expense.getDuplicateReason();
        this.recurringFrequency = expense.getRecurringFrequency();
        this.nextRecurringDate = expense.getNextRecurringDate();
        this.createdAt = expense.getCreatedAt();
        this.updatedAt = expense.getUpdatedAt();
    }

    // Getters
    public Long getId() { return id; }
    public String getVendorName() { return vendorName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public String getCategoryColor() { return categoryColor; }
    public String getDescription() { return description; }
    public String getReceiptUrl() { return receiptUrl; }
    public Boolean getIsDuplicate() { return isDuplicate; }
    public String getDuplicateReason() { return duplicateReason; }
    public com.smartledger.model.RecurringFrequency getRecurringFrequency() { return recurringFrequency; }
    public LocalDate getNextRecurringDate() { return nextRecurringDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
