package com.smartledger.model.dto;

import jakarta.validation.constraints.NotBlank;

public class ExpenseCategoryRequest {
    @NotBlank(message = "Category name is required")
    private String name;
    private String color;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
