package com.smartledger.controller;

import com.smartledger.model.dto.GlobalSearchResponse;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("Not authenticated");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping
    public ResponseEntity<GlobalSearchResponse> search(@RequestParam(name = "q", required = false, defaultValue = "") String query) {
        String email = getAuthenticatedUserEmail();
        return ResponseEntity.ok(searchService.search(email, query));
    }
}
