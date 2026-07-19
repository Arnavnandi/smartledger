package com.smartledger.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CurrencyService {

    private static final Logger logger = LoggerFactory.getLogger(CurrencyService.class);
    private static final String API_URL = "https://open.er-api.com/v6/latest/INR";
    private static final long CACHE_DURATION_MS = 3600000; // 1 hour

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private final Map<String, Double> ratesCache = new ConcurrentHashMap<>();
    private Instant lastFetched = Instant.EPOCH;

    public CurrencyService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private synchronized void fetchRatesIfNecessary() {
        if (Instant.now().toEpochMilli() - lastFetched.toEpochMilli() < CACHE_DURATION_MS && !ratesCache.isEmpty()) {
            return;
        }
        
        try {
            logger.info("Fetching fresh exchange rates from ER-API");
            String response = restTemplate.getForObject(API_URL, String.class);
            JsonNode root = objectMapper.readTree(response);
            
            if ("success".equals(root.path("result").asText())) {
                JsonNode ratesNode = root.path("rates");
                ratesNode.fields().forEachRemaining(entry -> {
                    ratesCache.put(entry.getKey(), entry.getValue().asDouble());
                });
                lastFetched = Instant.now();
                logger.info("Successfully updated exchange rates");
            } else {
                logger.warn("Failed to fetch exchange rates, result was not success");
            }
        } catch (Exception e) {
            logger.error("Error fetching exchange rates. Falling back to cached rates if available.", e);
        }
    }

    private BigDecimal getRate(String targetCurrency) {
        fetchRatesIfNecessary();
        
        // If target is INR, it's always 1.0
        if ("INR".equalsIgnoreCase(targetCurrency)) {
            return BigDecimal.ONE;
        }

        if (ratesCache.containsKey(targetCurrency.toUpperCase())) {
            return BigDecimal.valueOf(ratesCache.get(targetCurrency.toUpperCase()));
        }

        logger.warn("Exchange rate for {} not found. Falling back to 1:1", targetCurrency);
        return BigDecimal.ONE;
    }

    /**
     * Converts a base value (INR) to the target display currency.
     */
    public BigDecimal convertToDisplay(BigDecimal baseAmount, String displayCurrency) {
        if (baseAmount == null) return BigDecimal.ZERO;
        if (displayCurrency == null || "INR".equalsIgnoreCase(displayCurrency)) {
            return baseAmount;
        }
        BigDecimal rate = getRate(displayCurrency);
        return baseAmount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Converts a display value back to base currency (INR) for storage.
     */
    public BigDecimal convertToBase(BigDecimal displayAmount, String displayCurrency) {
        if (displayAmount == null) return BigDecimal.ZERO;
        if (displayCurrency == null || "INR".equalsIgnoreCase(displayCurrency)) {
            return displayAmount;
        }
        BigDecimal rate = getRate(displayCurrency);
        if (rate.compareTo(BigDecimal.ZERO) == 0) return displayAmount; // Guard against div by zero
        return displayAmount.divide(rate, 2, RoundingMode.HALF_UP);
    }

    /**
     * Legacy Double methods for Invoice and Dashboard pipelines.
     */
    public Double convertToDisplay(Double baseAmount, String displayCurrency) {
        if (baseAmount == null) return 0.0;
        return convertToDisplay(BigDecimal.valueOf(baseAmount), displayCurrency).doubleValue();
    }

    public Double convertToBase(Double displayAmount, String displayCurrency) {
        if (displayAmount == null) return 0.0;
        return convertToBase(BigDecimal.valueOf(displayAmount), displayCurrency).doubleValue();
    }
}
