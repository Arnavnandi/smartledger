package com.smartledger.repository;

import com.smartledger.model.Company;
import com.smartledger.model.ExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, Long> {
    List<ExpenseCategory> findByCompanyOrderByNameAsc(Company company);
    Optional<ExpenseCategory> findByIdAndCompany(Long id, Company company);
    boolean existsByCompanyAndNameIgnoreCase(Company company, String name);
}
