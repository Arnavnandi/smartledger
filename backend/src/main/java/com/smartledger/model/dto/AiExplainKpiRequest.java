package com.smartledger.model.dto;

public class AiExplainKpiRequest {
    private String kpiName;
    private Double currentValue;

    public AiExplainKpiRequest() {}

    public AiExplainKpiRequest(String kpiName, Double currentValue) {
        this.kpiName = kpiName;
        this.currentValue = currentValue;
    }

    public String getKpiName() { return kpiName; }
    public void setKpiName(String kpiName) { this.kpiName = kpiName; }

    public Double getCurrentValue() { return currentValue; }
    public void setCurrentValue(Double currentValue) { this.currentValue = currentValue; }
}
