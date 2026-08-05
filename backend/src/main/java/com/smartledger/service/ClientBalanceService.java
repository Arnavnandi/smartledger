package com.smartledger.service;

import com.smartledger.model.Client;
import com.smartledger.model.dto.ClientResponse;
import com.smartledger.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Centralized service for client balance computation.
 * 
 * Outstanding Due = Opening Balance + SUM(unpaid invoice totals)
 * 
 * This uses a computed approach (database query each time) rather than
 * maintaining a mutable cached balance, eliminating race conditions,
 * double-counting bugs, and consistency issues.
 */
@Service
public class ClientBalanceService {

    private static final Logger logger = LoggerFactory.getLogger(ClientBalanceService.class);

    private final InvoiceRepository invoiceRepository;
    private final CurrencyService currencyService;

    public ClientBalanceService(InvoiceRepository invoiceRepository, CurrencyService currencyService) {
        this.invoiceRepository = invoiceRepository;
        this.currencyService = currencyService;
    }

    /**
     * Compute the outstanding due for a client.
     * Outstanding Due = Opening Balance + SUM(all unpaid invoice totals)
     *
     * @param client The client entity
     * @return The computed outstanding due in base currency (stored units)
     */
    @Transactional(readOnly = true)
    public Double getOutstandingDue(Client client) {
        Double openingBalance = client.getOpeningBalance();
        Double unpaidInvoiceTotal = invoiceRepository.sumUnpaidInvoicesByClient(client);

        Double outstandingDue = openingBalance + (unpaidInvoiceTotal != null ? unpaidInvoiceTotal : 0.0);

        logger.debug("[BALANCE] Client: {} (id={}), OpeningBalance: {}, UnpaidInvoices: {}, OutstandingDue: {}",
                client.getName(), client.getId(), openingBalance, unpaidInvoiceTotal, outstandingDue);

        return outstandingDue;
    }

    /**
     * Build a ClientResponse with the computed outstanding due, 
     * converting to display currency.
     *
     * @param client   The client entity
     * @param currency The company currency code (e.g., "INR", "USD")
     * @return A fully populated ClientResponse with correct balance fields
     */
    public ClientResponse buildClientResponse(Client client, String currency) {
        ClientResponse response = new ClientResponse(client);

        Double outstandingDueBase = getOutstandingDue(client);

        response.setOpeningBalance(currencyService.convertToDisplay(client.getOpeningBalance(), currency));
        response.setOutstandingDue(currencyService.convertToDisplay(outstandingDueBase, currency));

        return response;
    }
}
