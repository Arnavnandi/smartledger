package com.smartledger.model.dto;

import com.smartledger.model.RecurringFrequency;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseRequest {
    @NotBlank(message = "Vendor name is required")
    private String vendorName;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Amount cannot be negative")
    private BigDecimal amount;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    private Long categoryId;
    private String category; // For AI extraction
    private String description;
    private String receiptUrl;
    
    private RecurringFrequency recurringFrequency = RecurringFrequency.NONE;

    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getReceiptUrl() { return receiptUrl; }
    public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }

    public RecurringFrequency getRecurringFrequency() { return recurringFrequency; }
    public void setRecurringFrequency(RecurringFrequency recurringFrequency) { this.recurringFrequency = recurringFrequency; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
