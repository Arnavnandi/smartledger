package com.smartledger.service;

import com.smartledger.model.Expense;
import com.smartledger.model.RecurringFrequency;
import com.smartledger.repository.ExpenseRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class RecurringExpenseScheduler {

    private final ExpenseRepository expenseRepository;
    private final ExpenseService expenseService;

    public RecurringExpenseScheduler(ExpenseRepository expenseRepository, ExpenseService expenseService) {
        this.expenseRepository = expenseRepository;
        this.expenseService = expenseService;
    }

    // Runs every day at 12:00 AM (midnight)
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processRecurringExpenses() {
        LocalDate today = LocalDate.now();

        // Get all expenses that are recurring and have a nextRecurringDate <= today
        // Wait, ExpenseRepository doesn't have this query yet. We need to add it or do it here.
        // I will fetch all and filter in memory since this is an MVP, but a query is better.
        List<Expense> allExpenses = expenseRepository.findAll();
        
        List<Expense> dueExpenses = allExpenses.stream()
            .filter(e -> e.getRecurringFrequency() != null && e.getRecurringFrequency() != RecurringFrequency.NONE)
            .filter(e -> e.getNextRecurringDate() != null && !e.getNextRecurringDate().isAfter(today))
            .toList();

        for (Expense original : dueExpenses) {
            // Create a new expense based on the original
            Expense clone = new Expense();
            clone.setCompany(original.getCompany());
            clone.setVendorName(original.getVendorName());
            clone.setAmount(original.getAmount());
            clone.setCategory(original.getCategory());
            clone.setDescription("Recurring: " + original.getDescription());
            clone.setExpenseDate(original.getNextRecurringDate()); // Use the scheduled date
            clone.setRecurringFrequency(original.getRecurringFrequency());
            
            // The clone gets the NEXT next date
            clone.setNextRecurringDate(expenseService.calculateNextDate(clone.getExpenseDate(), clone.getRecurringFrequency()));
            
            // Mark original as no longer the active recurring host, OR let the clone be the host
            // Usually, the newest one is the active recurring one.
            original.setRecurringFrequency(RecurringFrequency.NONE);
            original.setNextRecurringDate(null);
            
            expenseRepository.save(original);
            expenseRepository.save(clone);
        }
        
        System.out.println("Processed " + dueExpenses.size() + " recurring expenses.");
    }
}
