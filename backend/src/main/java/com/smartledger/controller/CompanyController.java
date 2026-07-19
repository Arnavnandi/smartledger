package com.smartledger.controller;

import com.smartledger.model.dto.ApiResponse;
import com.smartledger.model.dto.CompanyProfileRequest;
import com.smartledger.model.dto.CompanyProfileResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/company")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("Not authenticated");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping("/me")
    public ResponseEntity<CompanyProfileResponse> getMyCompany() {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(companyService.getCompanyProfile(email));
    }

    @PutMapping("/me")
    public ResponseEntity<CompanyProfileResponse> updateMyCompany(@Valid @RequestBody CompanyProfileRequest request) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(companyService.updateCompanyProfile(email, request));
    }

    @PostMapping("/logo")
    public ResponseEntity<?> uploadLogo(@RequestParam("file") MultipartFile file) {
        String email = getAuthenticatedUserEmail();
        try {
            CompanyProfileResponse response = companyService.uploadLogo(email, file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }
}
