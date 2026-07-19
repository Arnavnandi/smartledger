package com.smartledger.model.dto;

import com.smartledger.model.ClientActivity;
import java.time.LocalDateTime;

public class ClientActivityResponse {
    private Long id;
    private String actionType;
    private String description;
    private LocalDateTime timestamp;

    public ClientActivityResponse(ClientActivity activity) {
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
