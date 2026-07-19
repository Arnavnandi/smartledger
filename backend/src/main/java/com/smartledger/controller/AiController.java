package com.smartledger.controller;

import com.smartledger.model.dto.AiPromptRequest;
import com.smartledger.model.dto.AiResponse;
import com.smartledger.service.AiService;
import org.springframework.http.ResponseEntity;
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
        // Returns RAW JSON string array so frontend can parse it directly
        return ResponseEntity.ok(aiService.suggestItems(request.getPrompt()));
    }

    @PostMapping("/enhance-text")
    public ResponseEntity<AiResponse> enhanceText(@RequestBody AiPromptRequest request) {
        return ResponseEntity.ok(new AiResponse(aiService.enhanceDescription(request.getPrompt())));
    }

    @GetMapping("/invoice-summary/{id}")
    public ResponseEntity<AiResponse> getInvoiceSummary(@PathVariable Long id) {
        return ResponseEntity.ok(new AiResponse(aiService.generateSummary(id)));
    }
}
