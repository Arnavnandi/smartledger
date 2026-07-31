package com.smartledger.model.dto;

import java.util.List;

public class AiHealthResponse {
    private int score;
    private String status;
    private List<String> strengths;
    private List<String> risks;
    private List<String> recommendations;

    public AiHealthResponse() {}

    public AiHealthResponse(int score, String status, List<String> strengths, List<String> risks, List<String> recommendations) {
        this.score = score;
        this.status = status;
        this.strengths = strengths;
        this.risks = risks;
        this.recommendations = recommendations;
    }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }

    public List<String> getRisks() { return risks; }
    public void setRisks(List<String> risks) { this.risks = risks; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
}
