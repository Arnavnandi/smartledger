package com.smartledger.model.dto;

public class AiExecutiveSummaryResponse {
    private int financialScore;
    private String healthStatus;
    private String topInsight;
    private String biggestRisk;
    private String biggestOpportunity;
    private String suggestedAction;

    public AiExecutiveSummaryResponse() {}

    public AiExecutiveSummaryResponse(int financialScore, String healthStatus, String topInsight, String biggestRisk, String biggestOpportunity, String suggestedAction) {
        this.financialScore = financialScore;
        this.healthStatus = healthStatus;
        this.topInsight = topInsight;
        this.biggestRisk = biggestRisk;
        this.biggestOpportunity = biggestOpportunity;
        this.suggestedAction = suggestedAction;
    }

    public int getFinancialScore() { return financialScore; }
    public void setFinancialScore(int financialScore) { this.financialScore = financialScore; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }

    public String getTopInsight() { return topInsight; }
    public void setTopInsight(String topInsight) { this.topInsight = topInsight; }

    public String getBiggestRisk() { return biggestRisk; }
    public void setBiggestRisk(String biggestRisk) { this.biggestRisk = biggestRisk; }

    public String getBiggestOpportunity() { return biggestOpportunity; }
    public void setBiggestOpportunity(String biggestOpportunity) { this.biggestOpportunity = biggestOpportunity; }

    public String getSuggestedAction() { return suggestedAction; }
    public void setSuggestedAction(String suggestedAction) { this.suggestedAction = suggestedAction; }
}
