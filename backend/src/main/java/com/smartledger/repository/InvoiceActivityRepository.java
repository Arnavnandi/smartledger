package com.smartledger.repository;

import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceActivityRepository extends JpaRepository<InvoiceActivity, Long> {
    List<InvoiceActivity> findByInvoiceOrderByTimestampDesc(Invoice invoice);
}
