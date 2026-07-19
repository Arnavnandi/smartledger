package com.smartledger.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.config.AiConfig;
import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceItem;
import com.smartledger.repository.InvoiceRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AiService.class);

    private final RestTemplate restTemplate;
    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper;
    private final InvoiceRepository invoiceRepository;
    private final CurrencyService currencyService;

    public AiService(RestTemplate restTemplate, AiConfig aiConfig, ObjectMapper objectMapper, InvoiceRepository invoiceRepository, CurrencyService currencyService) {
        this.restTemplate = restTemplate;
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.invoiceRepository = invoiceRepository;
        this.currencyService = currencyService;
    }

    private String callGemini(String prompt) {
        if (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isEmpty()) {
            return "{\"error\": \"Gemini API Key is not configured.\"}"; // Fallback for UI testing
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + aiConfig.getGeminiModel() + ":generateContent?key=" + aiConfig.getGeminiApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        parts.put("text", prompt);
        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(parts));
        requestBody.put("contents", List.of(contents));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = executeWithRetry(url, request);
            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            // Clean up Markdown code blocks if AI wrapped JSON in ```json ... ```
            if (text.startsWith("```json")) {
                text = text.substring(7);
            }
            if (text.startsWith("```")) {
                text = text.substring(3);
            }
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
            
            return text.trim();
        } catch (Exception e) {
            logger.error("Failed to process AI request", e);
            throw new RuntimeException("Failed to process AI request. The service might be temporarily unavailable.");
        }
    }

    private ResponseEntity<String> executeWithRetry(String url, HttpEntity<Map<String, Object>> request) {
        int maxRetries = 3;
        long backoffTime = 1000;
        Exception lastException = null;

        for (int i = 0; i < maxRetries; i++) {
            try {
                return restTemplate.postForEntity(url, request, String.class);
            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                lastException = e;
                if (e.getStatusCode().value() == 503 || e.getStatusCode().value() == 429) {
                    logger.warn("Gemini API returned " + e.getStatusCode().value() + ", retrying in " + backoffTime + "ms");
                    try {
                        Thread.sleep(backoffTime);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    backoffTime *= 2;
                } else {
                    logger.error("Gemini API returned error: " + e.getResponseBodyAsString());
                    throw e;
                }
            } catch (Exception e) {
                lastException = e;
                logger.warn("Gemini API request failed, retrying in " + backoffTime + "ms: " + e.getMessage());
                try {
                    Thread.sleep(backoffTime);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                }
                backoffTime *= 2;
            }
        }
        throw new RuntimeException("Failed after " + maxRetries + " retries", lastException);
    }

    public String suggestItems(String inputPrompt) {
        String prompt = "You are an AI Invoice assistant. The user will provide a rough description of services or products they provided. " +
                "You must extract this into a structured JSON array of line items. " +
                "Each item must have: 'description' (string, professional), 'quantity' (number), 'unitPrice' (number, guess a reasonable market price in USD if not provided), 'taxRate' (number, standard 0 or 5 or 10 based on standard services), 'discount' (number, 0). " +
                "Return ONLY valid JSON array. Do not return any other text. \n\nUser Input: " + inputPrompt;
        
        return callGemini(prompt);
    }

    public String enhanceDescription(String rawText) {
        String prompt = "You are an AI professional writer. Rewrite the following raw, informal text into a highly professional, polite, and clear sentence or paragraph suitable for a formal business invoice. " +
                "Return ONLY the rewritten text, no conversational filler.\n\nRaw Text: " + rawText;
        return callGemini(prompt);
    }

    public String generateSummary(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));

        String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "INR";
        StringBuilder details = new StringBuilder();
        details.append("Invoice Number: ").append(invoice.getInvoiceNumber()).append("\n");
        details.append("Client: ").append(invoice.getClient().getName()).append("\n");
        details.append("Total Amount: ").append(currency).append(" ").append(currencyService.convertToDisplay(invoice.getTotalAmount(), currency)).append("\n");
        details.append("Due Date: ").append(invoice.getDueDate()).append("\n");
        details.append("Items:\n");
        for (InvoiceItem item : invoice.getItems()) {
            details.append("- ").append(item.getQuantity()).append("x ").append(item.getDescription()).append(" (").append(currency).append(" ").append(currencyService.convertToDisplay(item.getTotal(), currency)).append(")\n");
        }

        String prompt = "You are a professional AI accountant assistant. Based on the following invoice details, write a short, polite 2-3 sentence summary paragraph. " +
                "This summary will be sent to the client to give them a friendly overview of the services billed. " +
                "Do not include greeting or sign-off, just the summary paragraph.\n\nDetails:\n" + details.toString();

        return callGemini(prompt);
    }

    public String extractReceiptData(byte[] imageBytes, String mimeType) {
        if (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isEmpty()) {
            return "{\"error\": \"Gemini API Key is not configured.\"}";
        }
        
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + aiConfig.getGeminiModel() + ":generateContent?key=" + aiConfig.getGeminiApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = "You are an AI accountant. Analyze this receipt image and extract the following details into a structured JSON object: " +
                "'vendorName' (string), 'amount' (number, total amount), 'expenseDate' (string, YYYY-MM-DD), 'category' (string, guess based on items). " +
                "Return ONLY a valid JSON object. No Markdown blocks, no additional text.";

        String base64Image = java.util.Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType);
        inlineData.put("data", base64Image);
        
        Map<String, Object> imagePart = new HashMap<>();
        imagePart.put("inlineData", inlineData);

        Map<String, Object> contents = new HashMap<>();
        contents.put("parts", List.of(textPart, imagePart));
        requestBody.put("contents", List.of(contents));

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = executeWithRetry(url, request);
            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            text = text.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
            return text;
        } catch (Exception e) {
            logger.error("Failed to process receipt image", e);
            throw new RuntimeException("Failed to process receipt image. Please try again later.");
        }
    }

    public String generateFinancialInsights(String summaryData) {
        String prompt = "Act as a fractional CFO for a small business. I will provide you with my company's financial summary for this month. " +
                        "Please provide 3-4 bullet points of actionable business advice, warnings about cash flow, or congratulations based on these numbers.\n\n" +
                        "Financial Summary:\n" + summaryData + "\n\n" +
                        "Format the output as clean Markdown bullet points.";
        return callGemini(prompt);
    }
}
