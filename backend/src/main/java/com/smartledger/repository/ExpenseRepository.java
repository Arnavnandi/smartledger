package com.smartledger.repository;

import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long>, JpaSpecificationExecutor<Expense> {
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category"})
    Page<Expense> findByCompany(Company company, Pageable pageable);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"category"})
    @Query("SELECT e FROM Expense e LEFT JOIN e.category c WHERE e.company = :company AND " +
           "(LOWER(e.vendorName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Expense> searchByCompanyAndKeyword(@Param("company") Company company, 
                                           @Param("search") String search, 
                                           Pageable pageable);

    Optional<Expense> findByIdAndCompany(Long id, Company company);

    // Used for duplicate detection
    @Query("SELECT e FROM Expense e WHERE e.company = :company AND LOWER(e.vendorName) = LOWER(:vendorName) AND e.amount = :amount AND e.expenseDate BETWEEN :startDate AND :endDate AND e.id != :excludeId")
    List<Expense> findPotentialDuplicates(
            @Param("company") Company company,
            @Param("vendorName") String vendorName,
            @Param("amount") BigDecimal amount,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );

    // Dashboard Aggregations
    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.company = :company")
    BigDecimal sumTotalExpenses(@Param("company") Company company);

    @Query("SELECT e FROM Expense e WHERE e.company = :company AND e.expenseDate >= :startDate")
    List<Expense> findExpensesSince(@Param("company") Company company, @Param("startDate") LocalDate startDate);
}
