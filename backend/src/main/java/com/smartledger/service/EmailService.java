package com.smartledger.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String to, String token) {
        String subject = "Verify your email - SmartLedger";
        String message = "Please verify your email by clicking the link below:\n" +
                frontendUrl + "/verify-email?token=" + token;

        sendEmail(to, subject, message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Password Reset - SmartLedger";
        String message = "To reset your password, click the link below:\n" +
                frontendUrl + "/reset-password?token=" + token;

        sendEmail(to, subject, message);
    }

    private void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            mailSender.send(message);
        } catch (Exception e) {
            logger.error("Failed to send email to {}", to, e);
        }
    }

    public void sendInvoiceEmail(com.smartledger.model.Invoice invoice, byte[] pdfData) {
        if (mailSender == null) return;
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true);

            helper.setTo(invoice.getClient().getEmail());
            helper.setSubject("Invoice " + invoice.getInvoiceNumber() + " from " + invoice.getCompany().getName());
            
            String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "$";
            String htmlText = "<h3>Hello " + invoice.getClient().getName() + ",</h3>" +
                    "<p>Please find attached your invoice <b>" + invoice.getInvoiceNumber() + "</b> for <b>" + currency + String.format("%.2f", invoice.getTotalAmount()) + "</b>.</p>" +
                    "<p>Due Date: <b>" + invoice.getDueDate() + "</b></p>" +
                    "<br/><p>Thank you for your business!</p>" +
                    "<p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";
                    
            helper.setText(htmlText, true);
            helper.addAttachment("Invoice_" + invoice.getInvoiceNumber() + ".pdf", new org.springframework.core.io.ByteArrayResource(pdfData));

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }

    public void sendDueReminder(com.smartledger.model.Invoice invoice) {
        if (mailSender == null) return;
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true);

            helper.setTo(invoice.getClient().getEmail());
            helper.setSubject("Reminder: Invoice " + invoice.getInvoiceNumber() + " is due soon");
            
            String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "$";
            String htmlText = "<h3>Hello " + invoice.getClient().getName() + ",</h3>" +
                    "<p>This is a friendly reminder that invoice <b>" + invoice.getInvoiceNumber() + "</b> for <b>" + currency + String.format("%.2f", invoice.getTotalAmount()) + "</b> is due on <b>" + invoice.getDueDate() + "</b>.</p>" +
                    "<p>If you have already paid, please ignore this email.</p>" +
                    "<br/><p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";
                    
            helper.setText(htmlText, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send reminder email: " + e.getMessage());
        }
    }

    public void sendPaymentReminder(com.smartledger.model.Invoice invoice) {
        if (mailSender == null) return;
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true);

            helper.setTo(invoice.getClient().getEmail());
            helper.setSubject("URGENT: Invoice " + invoice.getInvoiceNumber() + " is Overdue");
            
            String currency = invoice.getCompany().getCurrency() != null ? invoice.getCompany().getCurrency() : "$";
            String htmlText = "<h3 style='color:red;'>Hello " + invoice.getClient().getName() + ",</h3>" +
                    "<p>According to our records, invoice <b>" + invoice.getInvoiceNumber() + "</b> for <b>" + currency + String.format("%.2f", invoice.getTotalAmount()) + "</b> is now OVERDUE. It was due on <b>" + invoice.getDueDate() + "</b>.</p>" +
                    "<p>Please arrange payment as soon as possible.</p>" +
                    "<br/><p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";
                    
            helper.setText(htmlText, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send overdue email: " + e.getMessage());
        }
    }

    public void sendPaymentSuccess(com.smartledger.model.Invoice invoice) {
        if (mailSender == null) return;
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true);

            helper.setTo(invoice.getClient().getEmail());
            helper.setSubject("Payment Received for Invoice " + invoice.getInvoiceNumber());
            
            String htmlText = "<h3>Hello " + invoice.getClient().getName() + ",</h3>" +
                    "<p>We have successfully received your payment for invoice <b>" + invoice.getInvoiceNumber() + "</b>.</p>" +
                    "<p>Thank you for your prompt payment and continued business!</p>" +
                    "<br/><p>Best regards,<br/>" + invoice.getCompany().getName() + "</p>";
                    
            helper.setText(htmlText, true);
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send success email: " + e.getMessage());
        }
    }
}
