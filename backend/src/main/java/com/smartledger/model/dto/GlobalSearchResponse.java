package com.smartledger.model.dto;

import java.util.List;

public class GlobalSearchResponse {
    private List<SearchResultItem> invoices;
    private List<SearchResultItem> clients;
    private List<SearchResultItem> expenses;

    public GlobalSearchResponse() {}

    public GlobalSearchResponse(List<SearchResultItem> invoices, List<SearchResultItem> clients, List<SearchResultItem> expenses) {
        this.invoices = invoices;
        this.clients = clients;
        this.expenses = expenses;
    }

    public List<SearchResultItem> getInvoices() { return invoices; }
    public void setInvoices(List<SearchResultItem> invoices) { this.invoices = invoices; }

    public List<SearchResultItem> getClients() { return clients; }
    public void setClients(List<SearchResultItem> clients) { this.clients = clients; }

    public List<SearchResultItem> getExpenses() { return expenses; }
    public void setExpenses(List<SearchResultItem> expenses) { this.expenses = expenses; }
}
