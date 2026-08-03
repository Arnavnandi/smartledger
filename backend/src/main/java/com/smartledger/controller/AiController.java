package com.smartledger.controller;

import com.smartledger.model.dto.*;
import com.smartledger.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/suggest-items")
    public ResponseEntity<String> suggestItems(@RequestBody AiPromptRequest request) {
        return ResponseEntity.ok(aiService.suggestItems(request.getPrompt()));
    }

    @PostMapping("/autofill-invoice")
    public ResponseEntity<AiAutofillInvoiceResponse> autofillInvoice(@RequestBody AiPromptRequest request) {
        return ResponseEntity.ok(aiService.autofillInvoice(request.getPrompt()));
    }

    @PostMapping("/enhance-text")
    public ResponseEntity<AiResponse> enhanceText(@RequestBody AiPromptRequest request) {
        return ResponseEntity.ok(new AiResponse(aiService.enhanceDescription(request.getPrompt())));
    }

    @GetMapping("/invoice-summary/{id}")
    public ResponseEntity<AiResponse> getInvoiceSummary(@PathVariable Long id) {
        return ResponseEntity.ok(new AiResponse(aiService.generateSummary(id)));
    }

    @GetMapping("/executive-summary")
    public ResponseEntity<AiExecutiveSummaryResponse> getExecutiveSummary(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(aiService.getExecutiveSummary(userDetails.getUsername()));
    }

    @GetMapping("/health")
    public ResponseEntity<AiHealthResponse> getFinancialHealth(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(aiService.getFinancialHealth(userDetails.getUsername()));
    }

    @GetMapping("/cash-flow-prediction")
    public ResponseEntity<AiCashFlowPredictionResponse> getCashFlowPrediction(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(aiService.getCashFlowPrediction(userDetails.getUsername()));
    }

    @PostMapping("/explain-kpi")
    public ResponseEntity<AiResponse> explainKpi(@AuthenticationPrincipal UserDetails userDetails, @RequestBody AiExplainKpiRequest request) {
        String explanation = aiService.explainKpi(userDetails.getUsername(), request.getKpiName(), request.getCurrentValue());
        return ResponseEntity.ok(new AiResponse(explanation));
    }
}
