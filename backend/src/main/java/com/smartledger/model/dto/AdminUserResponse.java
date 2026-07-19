package com.smartledger.model.dto;

import com.smartledger.model.User;
import java.time.LocalDateTime;

public class AdminUserResponse {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private boolean isEmailVerified;
    private LocalDateTime createdAt;

    public AdminUserResponse(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.role = user.getRole().name();
        this.isEmailVerified = user.isEmailVerified();
        this.createdAt = user.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getRole() { return role; }
    public boolean isEmailVerified() { return isEmailVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
