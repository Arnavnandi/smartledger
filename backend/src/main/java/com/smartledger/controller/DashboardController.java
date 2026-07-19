package com.smartledger.controller;

import com.smartledger.model.dto.ChartDataPoint;
import com.smartledger.model.dto.DashboardSummaryResponse;
import com.smartledger.model.dto.TopClientDTO;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ((CustomUserDetails) authentication.getPrincipal()).getUsername();
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary(getAuthenticatedUserEmail()));
    }

    @GetMapping("/cash-flow")
    public ResponseEntity<List<ChartDataPoint>> getCashFlow(@RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(dashboardService.getCashFlow(getAuthenticatedUserEmail(), months));
    }

    @GetMapping("/top-clients")
    public ResponseEntity<List<TopClientDTO>> getTopClients(@RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(dashboardService.getTopClients(getAuthenticatedUserEmail(), limit));
    }

    @GetMapping("/insights")
    public ResponseEntity<java.util.Map<String, String>> getInsights() {
        String insights = dashboardService.getFinancialInsights(getAuthenticatedUserEmail());
        return ResponseEntity.ok(java.util.Map.of("insights", insights));
    }
}
