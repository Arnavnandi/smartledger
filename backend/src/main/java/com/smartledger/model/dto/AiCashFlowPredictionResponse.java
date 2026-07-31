package com.smartledger.model.dto;

public class AiCashFlowPredictionResponse {
    private Double nextMonthRevenue;
    private Double nextMonthExpenses;
    private Double expectedProfit;
    private int confidenceLevel;
    private String reasoning;

    public AiCashFlowPredictionResponse() {}

    public AiCashFlowPredictionResponse(Double nextMonthRevenue, Double nextMonthExpenses, Double expectedProfit, int confidenceLevel, String reasoning) {
        this.nextMonthRevenue = nextMonthRevenue;
        this.nextMonthExpenses = nextMonthExpenses;
        this.expectedProfit = expectedProfit;
        this.confidenceLevel = confidenceLevel;
        this.reasoning = reasoning;
    }

    public Double getNextMonthRevenue() { return nextMonthRevenue; }
    public void setNextMonthRevenue(Double nextMonthRevenue) { this.nextMonthRevenue = nextMonthRevenue; }

    public Double getNextMonthExpenses() { return nextMonthExpenses; }
    public void setNextMonthExpenses(Double nextMonthExpenses) { this.nextMonthExpenses = nextMonthExpenses; }

    public Double getExpectedProfit() { return expectedProfit; }
    public void setExpectedProfit(Double expectedProfit) { this.expectedProfit = expectedProfit; }

    public int getConfidenceLevel() { return confidenceLevel; }
    public void setConfidenceLevel(int confidenceLevel) { this.confidenceLevel = confidenceLevel; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }
}
