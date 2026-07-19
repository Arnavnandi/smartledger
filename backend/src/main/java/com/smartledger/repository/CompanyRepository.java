package com.smartledger.repository;

import com.smartledger.model.Company;
import com.smartledger.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByOwner(User owner);
    boolean existsByOwner(User owner);
    
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Company c JOIN FETCH c.owner o WHERE o.email = :email")
    Optional<Company> findByOwnerEmail(@org.springframework.data.repository.query.Param("email") String email);
}
