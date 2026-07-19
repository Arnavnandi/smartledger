package com.smartledger.repository;

import com.smartledger.model.Client;
import com.smartledger.model.Company;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    
    Page<Client> findByCompany(Company company, Pageable pageable);

    @Query("SELECT c FROM Client c WHERE c.company = :company AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Client> searchByCompanyAndKeyword(@Param("company") Company company, 
                                           @Param("search") String search, 
                                           Pageable pageable);

    Optional<Client> findByIdAndCompany(Long id, Company company);
}
