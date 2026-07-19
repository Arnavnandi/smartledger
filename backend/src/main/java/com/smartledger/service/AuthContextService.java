package com.smartledger.service;

import com.smartledger.model.Company;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthContextService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public AuthContextService(CompanyRepository companyRepository, UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Company getAuthenticatedUserCompany(String email) {
        return companyRepository.findByOwnerEmail(email)
                .orElseGet(() -> {
                    com.smartledger.model.User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    Company newCompany = new Company();
                    newCompany.setName(user.getFirstName() + "'s Business");
                    newCompany.setOwner(user);
                    return companyRepository.save(newCompany);
                });
    }
}
