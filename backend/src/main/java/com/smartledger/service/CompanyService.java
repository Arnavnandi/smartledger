package com.smartledger.service;

import com.smartledger.model.Company;
import com.smartledger.model.User;
import com.smartledger.model.dto.CompanyProfileRequest;
import com.smartledger.model.dto.CompanyProfileResponse;
import com.smartledger.repository.CompanyRepository;
import com.smartledger.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository, FileStorageService fileStorageService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    public CompanyProfileResponse getCompanyProfile(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Company company = companyRepository.findByOwner(user)
                .orElseGet(() -> {
                    // Create default empty profile if it doesn't exist
                    Company newCompany = new Company();
                    newCompany.setName(user.getFirstName() + "'s Business");
                    newCompany.setOwner(user);
                    return companyRepository.save(newCompany);
                });
        
        return new CompanyProfileResponse(company);
    }

    @Transactional
    public CompanyProfileResponse updateCompanyProfile(String userEmail, CompanyProfileRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Company company = companyRepository.findByOwner(user)
                .orElseGet(() -> {
                    Company newCompany = new Company();
                    newCompany.setOwner(user);
                    return newCompany;
                });
        
        company.setName(request.getName());
        company.setGstNumber(request.getGstNumber());
        company.setAddress(request.getAddress());
        String currency = request.getCurrency() != null ? request.getCurrency().toUpperCase() : "INR";
        if (!java.util.List.of("INR", "USD", "EUR", "GBP").contains(currency)) {
            currency = "INR";
        }
        company.setCurrency(currency);
        company.setTaxRate(request.getTaxRate() != null ? request.getTaxRate() : 0.0);
        company.setInvoicePrefix(request.getInvoicePrefix() != null ? request.getInvoicePrefix() : "INV-");
        
        company = companyRepository.save(company);
        return new CompanyProfileResponse(company);
    }

    @Transactional
    public CompanyProfileResponse uploadLogo(String userEmail, MultipartFile file) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Company company = companyRepository.findByOwner(user)
                .orElseThrow(() -> new RuntimeException("Company profile must be created first"));
        
        String logoUrl = fileStorageService.storeFile(file);
        company.setLogoUrl(logoUrl);
        
        company = companyRepository.save(company);
        return new CompanyProfileResponse(company);
    }
}
