package com.smartledger.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.config.AiConfig;
import com.smartledger.model.dto.AiAutofillInvoiceResponse;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;

class AiServiceTest {

    private RestTemplate restTemplate;
    private AiConfig aiConfig;
    private ObjectMapper objectMapper;
    private InvoiceRepository invoiceRepository;
    private ExpenseRepository expenseRepository;
    private CurrencyService currencyService;
    private AuthContextService authContextService;
    private AiService aiService;

    @BeforeEach
    void setUp() {
        restTemplate = Mockito.mock(RestTemplate.class);
        aiConfig = Mockito.mock(AiConfig.class);
        objectMapper = new ObjectMapper();
        invoiceRepository = Mockito.mock(InvoiceRepository.class);
        expenseRepository = Mockito.mock(ExpenseRepository.class);
        currencyService = Mockito.mock(CurrencyService.class);
        authContextService = Mockito.mock(AuthContextService.class);

        Mockito.when(aiConfig.getGeminiApiKey()).thenReturn(""); // No API key triggers fallback
        Mockito.when(aiConfig.getGeminiModel()).thenReturn("gemini-2.5-flash");

        aiService = new AiService(
                restTemplate, aiConfig, objectMapper, invoiceRepository, expenseRepository, currencyService, authContextService
        );
    }

    @Test
    void testAutofillInvoiceFallbackOnNoApiKey() {
        AiAutofillInvoiceResponse response = aiService.autofillInvoice("Billed Acme Corp 2 hours for UI Design");
        assertNotNull(response);
        assertNull(response.getClientName());
        assertNull(response.getIssueDate());
    }

    @Test
    void testParseJsonResponse() throws Exception {
        String mockGeminiResponse = "{\n" +
                "  \"clientName\": \"Acme Corp\",\n" +
                "  \"issueDate\": \"2026-08-01\",\n" +
                "  \"dueDate\": \"2026-08-15\",\n" +
                "  \"items\": [\n" +
                "    {\n" +
                "      \"description\": \"UI Design\",\n" +
                "      \"quantity\": 2.0,\n" +
                "      \"price\": 150.0,\n" +
                "      \"taxPercent\": 0.0,\n" +
                "      \"discountPercent\": 0.0\n" +
                "    }\n" +
                "  ],\n" +
                "  \"notes\": \"Payment due in 14 days\",\n" +
                "  \"terms\": \"Net 15\"\n" +
                "}";

        AiAutofillInvoiceResponse response = objectMapper.readValue(mockGeminiResponse, AiAutofillInvoiceResponse.class);
        assertEquals("Acme Corp", response.getClientName());
        assertEquals("2026-08-01", response.getIssueDate());
        assertEquals(1, response.getItems().size());
        assertEquals(150.0, response.getItems().get(0).getPrice());
        assertEquals(0.0, response.getItems().get(0).getTaxPercent());
    }
}
