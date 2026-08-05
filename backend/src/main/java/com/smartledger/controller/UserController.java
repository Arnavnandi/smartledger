package com.smartledger.controller;

import com.smartledger.model.dto.ApiResponse;
import com.smartledger.model.dto.ChangePasswordRequest;
import com.smartledger.model.dto.UpdateProfileRequest;
import com.smartledger.model.dto.UserProfileResponse;
import com.smartledger.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    private String getAuthenticatedEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile() {
        String email = getAuthenticatedEmail();
        UserProfileResponse response = userService.getUserProfile(email);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String email = getAuthenticatedEmail();
        UserProfileResponse response = userService.updateUserProfile(email, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = getAuthenticatedEmail();
        try {
            userService.changePassword(email, request);
            return ResponseEntity.ok(new ApiResponse(true, "Password updated successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
