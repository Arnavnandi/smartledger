package com.smartledger.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartledger.exception.EmailDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    @Value("${BREVO_API_KEY:${brevo.api-key:}}")
    private String brevoApiKey;

    @Value("${BREVO_SENDER_EMAIL:${MAIL_USERNAME:${brevo.sender-email:}}}")
    private String brevoSenderEmail;

    @Value("${BREVO_SENDER_NAME:${brevo.sender-name:SmartLedger}}")
    private String brevoSenderName;

    @Value("${FRONTEND_URL:${app.frontend-url:http://localhost:5173}}")
    private String frontendUrl;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @Async
    public void sendVerificationEmail(String to, String token) {
        long start = System.currentTimeMillis();
        String subject = "Verify your email - SmartLedger";
        String html = "<h3>Welcome to SmartLedger!</h3>" +
                "<p>Please verify your email address by clicking the link below:</p>" +
                "<p><a href=\"" + frontendUrl + "/verify-email?token=" + token + "\">Verify Email</a></p>" +
                "<br/><p>If you did not request this, please ignore this email.</p>";

        try {
            dispatchEmail(to, subject, html, null);
            logger.info("[ASYNC VERIFICATION EMAIL] Dispatched to {} in {}ms", to, System.currentTimeMillis() - start);
        } catch (Exception ex) {
            logger.error("[ASYNC VERIFICATION EMAIL FAILED] Recipient: {}", to, ex);
        }
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        long start = System.currentTimeMillis();
        String subject = "Password Reset - SmartLedger";
        String html = "<h3>Password Reset Request</h3>" +
                "<p>To reset your password, click the link below:</p>" +
                "<p><a href=\"" + frontendUrl + "/reset-password?token=" + token + "\">Reset Password</a></p>";

        try {
            dispatchEmail(to, subject, html, null);
            logger.info("[ASYNC RESET EMAIL] Dispatched to {} in {}ms", to, System.currentTimeMillis() - start);
        } catch (Exception ex) {
            logger.error("[ASYNC RESET EMAIL FAILED] Recipient: {}", to, ex);
        }
    }

    @Async
    public void sendInvoiceEmail(com.smartledger.model.Invoice invoice, byte[] pdfData) {
        if (invoice == null || invoice.getClient() == null) return;
        String to = invoice.getClient().getEmail();
        String subject = "Invoice " + invoice.getInvoiceNumber() + " from " + invoice.getCompany().getName();
        String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "₹";
        
        String upiId = (invoice.getCompany().getUpiId() != null && !invoice.getCompany().getUpiId().trim().isEmpty()) 
                ? invoice.getCompany().getUpiId().trim() 
                : "8586808192@pthdfc";
        String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "https://smartledger-five.vercel.app";
        
        String paymentPageUrl = String.format("%s/pay?invoice=%s&amount=%.2f&company=%s&upi=%s&currency=%s",
                baseUrl,
                invoice.getInvoiceNumber(),
                invoice.getTotalAmount(),
                java.net.URLEncoder.encode(invoice.getCompany().getName() != null ? invoice.getCompany().getName() : "SmartLedger", java.nio.charset.StandardCharsets.UTF_8),
                java.net.URLEncoder.encode(upiId, java.nio.charset.StandardCharsets.UTF_8),
                java.net.URLEncoder.encode(currency, java.nio.charset.StandardCharsets.UTF_8));

        String htmlText = "<div style='font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;'>" +
                "<h2 style='color: #4f46e5; margin-top: 0;'>Invoice " + invoice.getInvoiceNumber() + "</h2>" +
                "<p>Hello <b>" + invoice.getClient().getName() + "</b>,</p>" +
                "<p>Please find attached your invoice for <b>" + currency + String.format(java.util.Locale.US, "%.2f", invoice.getTotalAmount()) + "</b>.</p>" +
                "<p>Due Date: <b>" + invoice.getDueDate() + "</b></p>" +
                "<div style='margin: 24px 0; text-align: left;'>" +
                "  <a href='" + paymentPageUrl + "' style='background-color: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'>Pay Online</a>" +
                "</div>" +
                "<p style='font-size: 12px; color: #64748b; margin-top: 16px;'>You can also scan the direct UPI QR code inside the attached PDF invoice using Google Pay, PhonePe, Paytm, or BHIM.</p>" +
                "<br/><p>Thank you for your business!</p>" +
                "<p>Best regards,<br/><b>" + invoice.getCompany().getName() + "</b></p>" +
                "</div>";

        List<Map<String, Object>> attachments = null;
        if (pdfData != null && pdfData.length > 0) {
            Map<String, Object> attachment = new HashMap<>();
            attachment.put("filename", "Invoice_" + invoice.getInvoiceNumber() + ".pdf");
            attachment.put("content", Base64.getEncoder().encodeToString(pdfData));
            attachments = List.of(attachment);
        }

        try {
            dispatchEmail(to, subject, htmlText, attachments);
        } catch (Exception ex) {
            logger.error("Failed to send invoice email asynchronously to {}", to, ex);
        }
    }

    @Async
    public void sendDueReminder(com.smartledger.model.Invoice invoice) {
        if (invoice == null || invoice.getClient() == null) return;
        String to = invoice.getClient().getEmail();
        String subject = "Reminder: Invoice " + invoice.getInvoiceNumber() + " is due soon";
        String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "$";
        String htmlText = "<h3>Hello " + invoice.getClient().getName() + ",</h3>" +
                "<p>This is a friendly reminder that invoice <b>" + invoice.getInvoiceNumber() + "</b> for <b>" + currency + String.format("%.2f", invoice.getTotalAmount()) + "</b> is due on <b>" + invoice.getDueDate() + "</b>.</p>" +
                "<p>If you have already paid, please ignore this email.</p>" +
                "<br/><p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";

        try {
            dispatchEmail(to, subject, htmlText, null);
        } catch (Exception ex) {
            logger.error("Failed to send due reminder email asynchronously to {}", to, ex);
        }
    }

    @Async
    public void sendPaymentReminder(com.smartledger.model.Invoice invoice) {
        if (invoice == null || invoice.getClient() == null) return;
        String to = invoice.getClient().getEmail();
        String subject = "URGENT: Invoice " + invoice.getInvoiceNumber() + " is Overdue";
        String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "$";
        String htmlText = "<h3 style='color:red;'>Hello " + invoice.getClient().getName() + ",</h3>" +
                "<p>According to our records, invoice <b>" + invoice.getInvoiceNumber() + "</b> for <b>" + currency + String.format("%.2f", invoice.getTotalAmount()) + "</b> is now OVERDUE. It was due on <b>" + invoice.getDueDate() + "</b>.</p>" +
                "<p>Please arrange payment as soon as possible.</p>" +
                "<br/><p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";

        try {
            dispatchEmail(to, subject, htmlText, null);
        } catch (Exception ex) {
            logger.error("Failed to send payment reminder email asynchronously to {}", to, ex);
        }
    }

    @Async
    public void sendPaymentSuccess(com.smartledger.model.Invoice invoice) {
        if (invoice == null || invoice.getClient() == null) return;
        String to = invoice.getClient().getEmail();
        String subject = "Payment Received for Invoice " + invoice.getInvoiceNumber();
        String htmlText = "<h3>Hello " + invoice.getClient().getName() + ",</h3>" +
                "<p>We have successfully received your payment for invoice <b>" + invoice.getInvoiceNumber() + "</b>.</p>" +
                "<p>Thank you for your prompt payment and continued business!</p>" +
                "<br/><p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";

        try {
            dispatchEmail(to, subject, htmlText, null);
        } catch (Exception ex) {
            logger.error("Failed to send payment success email asynchronously to {}", to, ex);
        }
    }

    private void dispatchEmail(String to, String subject, String htmlContent, List<Map<String, Object>> attachments) {
        logger.info("Email Service dispatching email to recipient: '{}', Subject: '{}'", to, subject);
        if (brevoApiKey == null || brevoApiKey.trim().isEmpty()) {
            logger.error("BREVO_API_KEY environment variable is missing or blank.");
            throw new EmailDeliveryException("Failed to send email: BREVO_API_KEY is not configured.");
        }
        sendEmailViaBrevo(to, subject, htmlContent, attachments);
    }

    private void sendEmailViaBrevo(String to, String subject, String htmlContent, List<Map<String, Object>> attachments) {
        try {
            Map<String, Object> bodyMap = new HashMap<>();
            String name = (brevoSenderName != null && !brevoSenderName.isBlank()) ? brevoSenderName : "SmartLedger";
            String email = (brevoSenderEmail != null && !brevoSenderEmail.isBlank()) ? brevoSenderEmail : "";

            if (email.isBlank()) {
                logger.error("BREVO_SENDER_EMAIL is blank or not configured!");
                throw new EmailDeliveryException("Failed to send email: BREVO_SENDER_EMAIL is not configured.");
            }

            logger.info("Sending HTTP POST to Brevo API. Sender: '{} <{}>', Recipient: '{}'", name, email, to);

            bodyMap.put("sender", Map.of("name", name, "email", email));
            bodyMap.put("to", List.of(Map.of("email", to)));
            bodyMap.put("subject", subject);
            bodyMap.put("htmlContent", htmlContent);

            if (attachments != null && !attachments.isEmpty()) {
                List<Map<String, String>> brevoAttachments = attachments.stream().map(att -> Map.of(
                        "name", att.get("filename").toString(),
                        "content", att.get("content").toString()
                )).collect(Collectors.toList());
                bodyMap.put("attachment", brevoAttachments);
            }

            String jsonPayload = objectMapper.writeValueAsString(bodyMap);

            long apiStart = System.currentTimeMillis();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", brevoApiKey.trim())
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long apiDuration = System.currentTimeMillis() - apiStart;

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Successfully delivered email to {} via Brevo API in {}ms (Status: {})", to, apiDuration, response.statusCode());
            } else {
                logger.error("Brevo API rejected email to {} after {}ms. Status: {}, Response: {}", to, apiDuration, response.statusCode(), response.body());
                throw new EmailDeliveryException("Failed to send email to " + to + " via Brevo (Status: " + response.statusCode() + "). " + response.body());
            }
        } catch (EmailDeliveryException ede) {
            throw ede;
        } catch (Exception ex) {
            logger.error("Network or serialization error while sending email to {} via Brevo", to, ex);
            throw new EmailDeliveryException("Failed to send email via Brevo due to connection failure: " + ex.getMessage(), ex);
        }
    }
}
