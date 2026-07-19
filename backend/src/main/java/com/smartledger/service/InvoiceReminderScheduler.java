package com.smartledger.service;

import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceStatus;
import com.smartledger.repository.InvoiceRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class InvoiceReminderScheduler {

    private final InvoiceRepository invoiceRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public InvoiceReminderScheduler(InvoiceRepository invoiceRepository, EmailService emailService, NotificationService notificationService) {
        this.invoiceRepository = invoiceRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    // Runs every day at 8:00 AM
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional
    public void processInvoiceReminders() {
        LocalDate today = LocalDate.now();
        LocalDate threeDaysFromNow = today.plusDays(3);

        // Find invoices due in exactly 3 days (PENDING)
        List<Invoice> allInvoices = invoiceRepository.findAll();
        
        for (Invoice invoice : allInvoices) {
            if (invoice.getStatus() == InvoiceStatus.PENDING && invoice.getDueDate() != null) {
                if (invoice.getDueDate().isEqual(threeDaysFromNow)) {
                    // Send Due Reminder
                    emailService.sendDueReminder(invoice);
                    notificationService.createNotification(
                        invoice.getCompany().getOwner(),
                        "Reminder sent to " + invoice.getClient().getName() + " for Invoice #" + invoice.getInvoiceNumber() + " (Due in 3 days)",
                        com.smartledger.model.NotificationType.INFO
                    );
                } else if (invoice.getDueDate().isBefore(today) && invoice.getStatus() != InvoiceStatus.OVERDUE) {
                    // Mark as Overdue and send Payment Reminder
                    invoice.setStatus(InvoiceStatus.OVERDUE);
                    invoiceRepository.save(invoice);
                    
                    emailService.sendPaymentReminder(invoice);
                    notificationService.createNotification(
                        invoice.getCompany().getOwner(),
                        "Invoice #" + invoice.getInvoiceNumber() + " for " + invoice.getClient().getName() + " is now OVERDUE. Payment reminder sent.",
                        com.smartledger.model.NotificationType.WARNING
                    );
                }
            } else if (invoice.getStatus() == InvoiceStatus.OVERDUE && invoice.getDueDate() != null) {
                // E.g., send a reminder every 7 days after it's overdue
                long daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(invoice.getDueDate(), today);
                if (daysOverdue > 0 && daysOverdue % 7 == 0) {
                    emailService.sendPaymentReminder(invoice);
                    notificationService.createNotification(
                        invoice.getCompany().getOwner(),
                        "Follow-up reminder sent to " + invoice.getClient().getName() + " for overdue Invoice #" + invoice.getInvoiceNumber(),
                        com.smartledger.model.NotificationType.WARNING
                    );
                }
            }
        }
    }
}
