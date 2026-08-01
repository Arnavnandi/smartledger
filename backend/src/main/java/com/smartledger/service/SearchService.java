package com.smartledger.service;

import com.smartledger.model.Client;
import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.Invoice;
import com.smartledger.model.dto.GlobalSearchResponse;
import com.smartledger.model.dto.SearchResultItem;
import com.smartledger.repository.ClientRepository;
import com.smartledger.repository.ExpenseRepository;
import com.smartledger.repository.InvoiceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class SearchService {

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final ExpenseRepository expenseRepository;
    private final AuthContextService authContextService;
    private final CurrencyService currencyService;

    public SearchService(InvoiceRepository invoiceRepository, 
                         ClientRepository clientRepository, 
                         ExpenseRepository expenseRepository, 
                         AuthContextService authContextService,
                         CurrencyService currencyService) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.expenseRepository = expenseRepository;
        this.authContextService = authContextService;
        this.currencyService = currencyService;
    }

    @Transactional(readOnly = true)
    public GlobalSearchResponse search(String email, String query) {
        if (query == null || query.trim().isEmpty()) {
            return new GlobalSearchResponse(List.of(), List.of(), List.of());
        }

        Company company = authContextService.getAuthenticatedUserCompany(email);
        String q = query.trim();

        // 1. Search Invoices
        Page<Invoice> invPage = invoiceRepository.searchByCompanyAndKeyword(company, q, PageRequest.of(0, 5, Sort.by("issueDate").descending()));
        List<SearchResultItem> invoiceItems = new ArrayList<>();
        for (Invoice inv : invPage.getContent()) {
            String currency = company.getCurrency() != null ? company.getCurrency() : "INR";
            Double amount = currencyService.convertToDisplay(inv.getTotalAmount(), currency);
            invoiceItems.add(new SearchResultItem(
                    String.valueOf(inv.getId()),
                    inv.getInvoiceNumber() + " - " + inv.getClient().getName(),
                    currency + " " + amount + " (" + inv.getStatus() + ")",
                    "INVOICE",
                    "/invoices/" + inv.getId()
            ));
        }

        // 2. Search Clients
        Page<Client> clientPage = clientRepository.searchByCompanyAndKeyword(company, q, PageRequest.of(0, 5, Sort.by("createdAt").descending()));
        List<SearchResultItem> clientItems = new ArrayList<>();
        for (Client c : clientPage.getContent()) {
            clientItems.add(new SearchResultItem(
                    String.valueOf(c.getId()),
                    c.getName(),
                    c.getEmail() != null ? c.getEmail() : "No email",
                    "CLIENT",
                    "/clients/" + c.getId()
            ));
        }

        // 3. Search Expenses
        Page<Expense> expPage = expenseRepository.searchByCompanyAndKeyword(company, q, PageRequest.of(0, 5, Sort.by("expenseDate").descending()));
        List<SearchResultItem> expenseItems = new ArrayList<>();
        for (Expense exp : expPage.getContent()) {
            String currency = company.getCurrency() != null ? company.getCurrency() : "INR";
            Double amount = currencyService.convertToDisplay(exp.getAmount() != null ? exp.getAmount().doubleValue() : 0.0, currency);
            String catName = exp.getCategory() != null ? exp.getCategory().getName() : "Uncategorized";
            expenseItems.add(new SearchResultItem(
                    String.valueOf(exp.getId()),
                    exp.getVendorName() + " (" + catName + ")",
                    currency + " " + amount + " on " + exp.getExpenseDate(),
                    "EXPENSE",
                    "/expenses"
            ));
        }

        return new GlobalSearchResponse(invoiceItems, clientItems, expenseItems);
    }
}
