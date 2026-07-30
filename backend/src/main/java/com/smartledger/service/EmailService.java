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

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.sender-email:}")
    private String brevoSenderEmail;

    @Value("${brevo.sender-name:SmartLedger}")
    private String brevoSenderName;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:SmartLedger <onboarding@resend.dev>}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendVerificationEmail(String to, String token) {
        String subject = "Verify your email - SmartLedger";
        String html = "<h3>Welcome to SmartLedger!</h3>" +
                "<p>Please verify your email address by clicking the link below:</p>" +
                "<p><a href=\"" + frontendUrl + "/verify-email?token=" + token + "\">Verify Email</a></p>" +
                "<br/><p>If you did not request this, please ignore this email.</p>";

        dispatchEmail(to, subject, html, null);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Password Reset - SmartLedger";
        String html = "<h3>Password Reset Request</h3>" +
                "<p>To reset your password, click the link below:</p>" +
                "<p><a href=\"" + frontendUrl + "/reset-password?token=" + token + "\">Reset Password</a></p>";

        dispatchEmail(to, subject, html, null);
    }

    @Async
    public void sendInvoiceEmail(com.smartledger.model.Invoice invoice, byte[] pdfData) {
        if (invoice == null || invoice.getClient() == null) return;
        String to = invoice.getClient().getEmail();
        String subject = "Invoice " + invoice.getInvoiceNumber() + " from " + invoice.getCompany().getName();
        String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "$";
        String htmlText = "<h3>Hello " + invoice.getClient().getName() + ",</h3>" +
                "<p>Please find attached your invoice <b>" + invoice.getInvoiceNumber() + "</b> for <b>" + currency + String.format("%.2f", invoice.getTotalAmount()) + "</b>.</p>" +
                "<p>Due Date: <b>" + invoice.getDueDate() + "</b></p>" +
                "<br/><p>Thank you for your business!</p>" +
                "<p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";

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
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            sendEmailViaBrevo(to, subject, htmlContent, attachments);
        } else if (resendApiKey != null && !resendApiKey.trim().isEmpty()) {
            sendEmailViaResend(to, subject, htmlContent, attachments);
        } else {
            logger.error("Neither BREVO_API_KEY nor RESEND_API_KEY is configured.");
            throw new EmailDeliveryException("Failed to send email: No API key provided (set BREVO_API_KEY or RESEND_API_KEY).");
        }
    }

    private void sendEmailViaBrevo(String to, String subject, String htmlContent, List<Map<String, Object>> attachments) {
        try {
            Map<String, Object> bodyMap = new HashMap<>();
            String name = (brevoSenderName != null && !brevoSenderName.isBlank()) ? brevoSenderName : "SmartLedger";
            String email = (brevoSenderEmail != null && !brevoSenderEmail.isBlank()) ? brevoSenderEmail : "no-reply@smartledger.app";

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

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", brevoApiKey.trim())
                    .header("accept", "application/json")
                    .header("content-type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Successfully delivered email to {} via Brevo API (Status: {})", to, response.statusCode());
            } else {
                logger.error("Brevo API rejected email to {}. Status: {}, Response: {}", to, response.statusCode(), response.body());
                throw new EmailDeliveryException("Failed to send email to " + to + " via Brevo (Status: " + response.statusCode() + "). " + response.body());
            }
        } catch (EmailDeliveryException ede) {
            throw ede;
        } catch (Exception ex) {
            logger.error("Network or serialization error while sending email to {} via Brevo", to, ex);
            throw new EmailDeliveryException("Failed to send email via Brevo due to connection failure: " + ex.getMessage(), ex);
        }
    }

    private void sendEmailViaResend(String to, String subject, String htmlContent, List<Map<String, Object>> attachments) {
        try {
            Map<String, Object> bodyMap = new HashMap<>();
            bodyMap.put("from", fromEmail != null && !fromEmail.isBlank() ? fromEmail : "SmartLedger <onboarding@resend.dev>");
            bodyMap.put("to", List.of(to));
            bodyMap.put("subject", subject);
            bodyMap.put("html", htmlContent);
            if (attachments != null && !attachments.isEmpty()) {
                bodyMap.put("attachments", attachments);
            }

            String jsonPayload = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(RESEND_API_URL))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Successfully delivered email to {} via Resend API (Status: {})", to, response.statusCode());
            } else {
                logger.error("Resend API rejected email to {}. Status: {}, Response: {}", to, response.statusCode(), response.body());
                throw new EmailDeliveryException("Failed to send email to " + to + " via Resend (Status: " + response.statusCode() + "). " + response.body());
            }
        } catch (EmailDeliveryException ede) {
            throw ede;
        } catch (Exception ex) {
            logger.error("Network or serialization error while sending email to {}", to, ex);
            throw new EmailDeliveryException("Failed to send email due to connection failure: " + ex.getMessage(), ex);
        }
    }
}
