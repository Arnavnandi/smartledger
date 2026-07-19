package com.smartledger.model.dto;

import com.smartledger.model.ExpenseCategory;

public class ExpenseCategoryResponse {
    private Long id;
    private String name;
    private String color;

    public ExpenseCategoryResponse(ExpenseCategory category) {
        this.id = category.getId();
        this.name = category.getName();
        this.color = category.getColor();
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getColor() { return color; }
}
