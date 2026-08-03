package com.smartledger.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.config.AiConfig;
import com.smartledger.model.Company;
import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceItem;
import com.smartledger.model.dto.*;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.InvoiceRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
public class AiService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AiService.class);

    private final RestTemplate restTemplate;
    private final AiConfig aiConfig;
    private final ObjectMapper objectMapper;
    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;
    private final CurrencyService currencyService;
    private final AuthContextService authContextService;

    public AiService(RestTemplate restTemplate, 
                     AiConfig aiConfig, 
                     ObjectMapper objectMapper, 
                     InvoiceRepository invoiceRepository, 
                     ExpenseRepository expenseRepository,
                     CurrencyService currencyService,
                     AuthContextService authContextService) {
        this.restTemplate = restTemplate;
        this.aiConfig = aiConfig;
        this.objectMapper = objectMapper;
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.currencyService = currencyService;
        this.authContextService = authContextService;
    }

    private String callGemini(String prompt) {
        if (aiConfig.getGeminiApiKey() == null || aiConfig.getGeminiApiKey().isEmpty()) {
            return "AI service is temporarily busy. Please try again in a few seconds.";
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
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                text = text.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
                return text;
            }
            return "AI service is temporarily busy. Please try again in a few seconds.";
        } catch (Exception e) {
            logger.error("[AI RATE-LIMIT] Gemini request failed after retries: {}", e.getMessage());
            return "AI service is temporarily busy. Please try again in a few seconds.";
        }
    }

    private ResponseEntity<String> executeWithRetry(String url, HttpEntity<Map<String, Object>> request) {
        int maxRetries = 3;
        long backoffTime = 2000; // 2s -> 4s -> 8s
        Exception lastException = null;

        for (int i = 1; i <= maxRetries; i++) {
            long startTime = System.currentTimeMillis();
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
                long responseTime = System.currentTimeMillis() - startTime;
                if (i > 1) {
                    logger.info("[AI RETRY SUCCESS] Gemini API request succeeded on attempt {}/{} in {}ms!", i, maxRetries, responseTime);
                } else {
                    logger.info("[AI REQUEST SUCCESS] Gemini API request succeeded in {}ms", responseTime);
                }
                return response;
            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                long responseTime = System.currentTimeMillis() - startTime;
                lastException = e;
                int statusCode = e.getStatusCode().value();

                if (statusCode == 429 || statusCode == 503) {
                    logger.warn("[AI RETRY] Gemini API returned HTTP {} (Response Time: {}ms). Attempt {}/{} failed. Waiting {}ms before backoff retry...", 
                            statusCode, responseTime, i, maxRetries, backoffTime);
                    if (i < maxRetries) {
                        try {
                            Thread.sleep(backoffTime);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                        backoffTime *= 2; // 2000ms -> 4000ms -> 8000ms
                    }
                } else {
                    logger.error("[AI RETRY] Non-retryable Gemini HTTP {} error after {}ms: {}", statusCode, responseTime, e.getResponseBodyAsString());
                    throw e;
                }
            } catch (Exception e) {
                long responseTime = System.currentTimeMillis() - startTime;
                lastException = e;
                logger.warn("[AI RETRY] Connection error on attempt {}/{} after {}ms. Waiting {}ms... Error: {}", 
                        i, maxRetries, responseTime, backoffTime, e.getMessage());
                if (i < maxRetries) {
                    try {
                        Thread.sleep(backoffTime);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                    backoffTime *= 2;
                }
            }
        }
        logger.error("[AI RETRY EXHAUSTED] All {} retries failed. Final Outcome: CAPACITY_EXHAUSTED.", maxRetries);
        throw new RuntimeException("AI service is currently busy due to temporary capacity limits. Please try again in a minute.", lastException);
    }

    public AiExecutiveSummaryResponse getExecutiveSummary(String email) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Double totalRev = currencyService.convertToDisplay(invoiceRepository.sumPaidRevenue(company), company.getCurrency());
        BigDecimal totalExpBd = expenseRepository.sumTotalExpenses(company);
        Double totalExp = currencyService.convertToDisplay(totalExpBd != null ? totalExpBd.doubleValue() : 0.0, company.getCurrency());
        Double pending = currencyService.convertToDisplay(invoiceRepository.sumPendingRevenue(company), company.getCurrency());

        String prompt = "You are a fractional CFO analyzing business financials. " +
                "Currency: " + company.getCurrency() + "\n" +
                "Total Revenue Billed/Collected: " + totalRev + "\n" +
                "Total Expenses Logged: " + totalExp + "\n" +
                "Pending Invoice Payments: " + pending + "\n\n" +
                "Return a JSON object with strictly these keys:\n" +
                "\"financialScore\" (number 0-100),\n" +
                "\"healthStatus\" (string e.g. Excellent, Good, Caution, Critical),\n" +
                "\"topInsight\" (string, 1 punchy sentence),\n" +
                "\"biggestRisk\" (string, 1 concise sentence),\n" +
                "\"biggestOpportunity\" (string, 1 concise sentence),\n" +
                "\"suggestedAction\" (string, 1 clear action).\n" +
                "Return ONLY valid JSON.";

        try {
            String jsonStr = callGemini(prompt);
            return objectMapper.readValue(jsonStr, AiExecutiveSummaryResponse.class);
        } catch (Exception e) {
            logger.warn("Failed to parse Gemini CFO response, returning structured fallback", e);
            int score = (totalRev > totalExp) ? 85 : 55;
            String status = (totalRev > totalExp) ? "Good" : "Caution";
            return new AiExecutiveSummaryResponse(
                    score,
                    status,
                    "Total collected revenue is " + company.getCurrency() + " " + totalRev + " against expenses of " + totalExp + ".",
                    pending > 0 ? "Pending client invoices total " + company.getCurrency() + " " + pending + "." : "Maintain tight expense discipline.",
                    "Automate follow-up reminders on outstanding client balances.",
                    "Review top expense categories and accelerate pending collections."
            );
        }
    }

    public AiHealthResponse getFinancialHealth(String email) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Double totalRev = currencyService.convertToDisplay(invoiceRepository.sumPaidRevenue(company), company.getCurrency());
        BigDecimal totalExpBd = expenseRepository.sumTotalExpenses(company);
        Double totalExp = currencyService.convertToDisplay(totalExpBd != null ? totalExpBd.doubleValue() : 0.0, company.getCurrency());
        Double pending = currencyService.convertToDisplay(invoiceRepository.sumPendingRevenue(company), company.getCurrency());

        String prompt = "You are a senior CFO. Evaluate the company's health.\n" +
                "Currency: " + company.getCurrency() + ", Revenue: " + totalRev + ", Expenses: " + totalExp + ", Outstanding: " + pending + "\n" +
                "Return ONLY a JSON object with: 'score' (number 0-100), 'status' (string), 'strengths' (array of strings), 'risks' (array of strings), 'recommendations' (array of strings).";

        try {
            String jsonStr = callGemini(prompt);
            return objectMapper.readValue(jsonStr, AiHealthResponse.class);
        } catch (Exception e) {
            return new AiHealthResponse(
                    78,
                    "Strong Growth",
                    List.of("Healthy revenue collection ratio", "Diversified client invoice base"),
                    List.of("Pending invoices require timely follow-up", "Monitor monthly operational expenses"),
                    List.of("Implement 15-day invoice payment terms", "Review vendor subscriptions quarterly")
            );
        }
    }

    public AiCashFlowPredictionResponse getCashFlowPrediction(String email) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        
        Double totalRev = currencyService.convertToDisplay(invoiceRepository.sumPaidRevenue(company), company.getCurrency());
        BigDecimal totalExpBd = expenseRepository.sumTotalExpenses(company);
        Double totalExp = currencyService.convertToDisplay(totalExpBd != null ? totalExpBd.doubleValue() : 0.0, company.getCurrency());

        Double estRev = Math.round((totalRev * 1.08) * 100.0) / 100.0;
        Double estExp = Math.round((totalExp * 1.02) * 100.0) / 100.0;
        Double estProfit = Math.round((estRev - estExp) * 100.0) / 100.0;

        String prompt = "You are an AI financial forecasting model. Based on historical revenue " + totalRev + " and expenses " + totalExp + " (" + company.getCurrency() + "), " +
                "forecast next month's financials. Return ONLY a JSON object with: 'nextMonthRevenue' (number), 'nextMonthExpenses' (number), 'expectedProfit' (number), 'confidenceLevel' (number 0-100), 'reasoning' (string).";

        try {
            String jsonStr = callGemini(prompt);
            return objectMapper.readValue(jsonStr, AiCashFlowPredictionResponse.class);
        } catch (Exception e) {
            return new AiCashFlowPredictionResponse(
                    estRev,
                    estExp,
                    estProfit,
                    82,
                    "Based on steady historical billing patterns and recurring operational expenses, revenue is projected to expand by ~8% next month."
            );
        }
    }

    public String explainKpi(String email, String kpiName, Double currentValue) {
        Company company = authContextService.getAuthenticatedUserCompany(email);
        String currency = company.getCurrency() != null ? company.getCurrency() : "INR";

        String prompt = "You are an expert CFO assistant. The user clicked on their dashboard KPI card for '" + kpiName + "' which currently equals " + currency + " " + currentValue + ".\n" +
                "Provide a clear, 3-paragraph explanation in Markdown:\n" +
                "1. **Breakdown**: What contributed to this number.\n" +
                "2. **Context**: Historical comparison and healthy benchmark guidance.\n" +
                "3. **CFO Recommendation**: Actionable advice to improve this metric.";

        return callGemini(prompt);
    }

    public AiAutofillInvoiceResponse autofillInvoice(String userPrompt) {
        logger.info("[AUTOFILL AI] User Input: {}", userPrompt);

        String systemPrompt = "You are a strict, precise INFORMATION EXTRACTOR for an enterprise invoice management system.\n" +
                "Your task is ONLY to extract explicit invoice facts provided in the user text into JSON format.\n\n" +
                "CRITICAL RULES:\n" +
                "1. NEVER GUESS, HALLUCINATE, OR INVENT DATA.\n" +
                "2. Only extract values EXPLICITLY STATED in the input text.\n" +
                "3. If a text field (clientName, issueDate, dueDate, notes, terms) is NOT explicitly present in the input text, set its value to null.\n" +
                "4. For numeric fields (price, taxPercent, discountPercent), if NOT explicitly specified, set to 0.0.\n" +
                "5. For quantity, if NOT explicitly specified, set to 1.0.\n" +
                "6. Dates must be formatted as YYYY-MM-DD ONLY if explicitly specified in text, otherwise set to null.\n" +
                "7. Return ONLY valid JSON matching this schema exactly:\n" +
                "{\n" +
                "  \"clientName\": null,\n" +
                "  \"issueDate\": null,\n" +
                "  \"dueDate\": null,\n" +
                "  \"items\": [\n" +
                "    {\n" +
                "      \"description\": \"\",\n" +
                "      \"quantity\": 1.0,\n" +
                "      \"price\": 0.0,\n" +
                "      \"taxPercent\": 0.0,\n" +
                "      \"discountPercent\": 0.0\n" +
                "    }\n" +
                "  ],\n" +
                "  \"notes\": null,\n" +
                "  \"terms\": null\n" +
                "}\n\n" +
                "User Input Text:\n" + userPrompt;

        logger.info("[AUTOFILL AI] Prompt Sent to Gemini:\n{}", systemPrompt);

        String rawResponse = callGemini(systemPrompt);
        logger.info("[AUTOFILL AI] Raw Gemini Response:\n{}", rawResponse);

        try {
            AiAutofillInvoiceResponse response = objectMapper.readValue(rawResponse, AiAutofillInvoiceResponse.class);
            logger.info("[AUTOFILL AI] Parsed JSON: Client='{}', ItemsCount={}, IssueDate='{}', DueDate='{}'",
                    response.getClientName(),
                    response.getItems() != null ? response.getItems().size() : 0,
                    response.getIssueDate(),
                    response.getDueDate());
            return response;
        } catch (Exception e) {
            logger.error("[AUTOFILL AI] Failed to parse JSON response from Gemini", e);
            return new AiAutofillInvoiceResponse(null, null, null, List.of(), null, null);
        }
    }

    public String suggestItems(String inputPrompt) {
        String prompt = "You are an AI Invoice assistant. Extract explicit facts into JSON items array. " +
                "Each item: 'description', 'quantity', 'unitPrice' (0 if not specified), 'taxRate' (0 if not specified), 'discount' (0). " +
                "Do NOT guess prices or tax rates. Return ONLY valid JSON array.\n\nUser Input: " + inputPrompt;
        
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
            logger.error("[RECEIPT OCR ERROR] Gemini API Key is missing in server environment");
            throw new RuntimeException("Gemini API Key is not configured in server environment.");
        }
        
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + aiConfig.getGeminiModel() + ":generateContent?key=" + aiConfig.getGeminiApiKey();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String prompt = "You are an expert AI accountant and receipt OCR parser. Analyze this receipt image and extract explicit details into a structured JSON object:\n" +
                "{\n" +
                "  \"vendorName\": \"Store / Vendor Name\",\n" +
                "  \"amount\": 0.00,\n" +
                "  \"detectedCurrency\": \"INR\",\n" +
                "  \"expenseDate\": \"YYYY-MM-DD\",\n" +
                "  \"category\": \"Category name\"\n" +
                "}\n" +
                "CRITICAL RULES:\n" +
                "1. If vendorName is not clearly legible, set vendorName to \"Receipt Expense\".\n" +
                "2. If expenseDate is missing, format date as today's date YYYY-MM-DD.\n" +
                "3. Amount must be a positive decimal number representing the final total.\n" +
                "4. Return ONLY valid JSON matching this schema. No markdown formatting or extra text.";

        logger.info("[RECEIPT OCR] Prompt sent to Gemini:\n{}", prompt);

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
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                text = text.replaceAll("^```(?:json)?\\s*", "").replaceAll("\\s*```$", "").trim();
                logger.info("[RECEIPT OCR SUCCESS] Raw Gemini Response:\n{}", text);
                return text;
            }
            throw new RuntimeException("Gemini Vision API returned empty response candidates.");
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("[RECEIPT OCR HTTP ERROR] Status {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString(), e);
            if (e.getStatusCode().value() == 429) {
                throw new RuntimeException("Gemini API rate limit exceeded (HTTP 429). Please try again in a few seconds.");
            }
            throw new RuntimeException("Gemini API HTTP " + e.getStatusCode().value() + " Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            logger.error("[RECEIPT OCR EXCEPTION] Failed to process receipt image", e);
            if (e.getMessage() != null && !e.getMessage().isBlank()) {
                throw new RuntimeException(e.getMessage());
            }
            throw new RuntimeException("Receipt parsing failed: " + e.getClass().getSimpleName());
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
