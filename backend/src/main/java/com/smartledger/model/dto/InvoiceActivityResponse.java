package com.smartledger.model.dto;

import com.smartledger.model.InvoiceActivity;
import java.time.LocalDateTime;

public class InvoiceActivityResponse {
    private Long id;
    private String actionType;
    private String description;
    private LocalDateTime timestamp;

    public InvoiceActivityResponse(InvoiceActivity activity) {
        this.id = activity.getId();
        this.actionType = activity.getActionType();
        this.description = activity.getDescription();
        this.timestamp = activity.getTimestamp();
    }

    public Long getId() { return id; }
    public String getActionType() { return actionType; }
    public String getDescription() { return description; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
