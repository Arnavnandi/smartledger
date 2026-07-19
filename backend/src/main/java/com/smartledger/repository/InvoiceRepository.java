package com.smartledger.repository;

import com.smartledger.model.Company;
import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "items"})
    Page<Invoice> findByCompany(Company company, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "items"})
    @Query("SELECT i FROM Invoice i WHERE i.company = :company AND " +
           "(LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.client.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Invoice> searchByCompanyAndKeyword(@Param("company") Company company, 
                                           @Param("search") String search, 
                                           Pageable pageable);

    // Dashboard Aggregations
    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.company = :company AND i.status = 'PAID'")
    Double sumPaidRevenue(@Param("company") Company company);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.company = :company AND i.status IN ('PENDING', 'OVERDUE')")
    Double sumPendingRevenue(@Param("company") Company company);

    @Query("SELECT new com.smartledger.model.dto.TopClientDTO(c.id, c.name, SUM(i.totalAmount)) " +
           "FROM Invoice i JOIN i.client c WHERE i.company = :company AND i.status = 'PAID' " +
           "GROUP BY c.id, c.name ORDER BY SUM(i.totalAmount) DESC")
    List<com.smartledger.model.dto.TopClientDTO> findTopClients(@Param("company") Company company, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE i.company = :company AND i.status = 'PAID' AND i.issueDate >= :startDate")
    List<Invoice> findPaidInvoicesSince(@Param("company") Company company, @Param("startDate") java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"client", "items"})
    Page<Invoice> findByCompanyAndStatus(Company company, InvoiceStatus status, Pageable pageable);

    Optional<Invoice> findByIdAndCompany(Long id, Company company);
}
