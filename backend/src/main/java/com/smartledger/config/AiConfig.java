package com.smartledger.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiConfig {

    @Value("${gemini.api-key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    public String getGeminiApiKey() {
        return geminiApiKey;
    }

    public String getGeminiModel() {
        return geminiModel;
    }
}
