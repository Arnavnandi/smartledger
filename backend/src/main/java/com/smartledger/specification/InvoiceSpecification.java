package com.smartledger.specification;

import com.smartledger.model.Company;
import com.smartledger.model.Invoice;
import com.smartledger.model.InvoiceStatus;
import com.smartledger.model.dto.InvoiceFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class InvoiceSpecification {
    
    public static Specification<Invoice> filterBy(Company company, InvoiceFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Must belong to company
            predicates.add(criteriaBuilder.equal(root.get("company"), company));

            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate searchInvNumber = criteriaBuilder.like(criteriaBuilder.lower(root.get("invoiceNumber")), searchPattern);
                Predicate searchClient = criteriaBuilder.like(criteriaBuilder.lower(root.get("client").get("name")), searchPattern);
                predicates.add(criteriaBuilder.or(searchInvNumber, searchClient));
            }

            if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
                try {
                    InvoiceStatus status = InvoiceStatus.valueOf(filter.getStatus().toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("status"), status));
                } catch (IllegalArgumentException e) {
                    // ignore invalid status
                }
            }

            if (filter.getClientId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("client").get("id"), filter.getClientId()));
            }

            if (filter.getStartDate() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("issueDate"), filter.getStartDate()));
            }
            
            if (filter.getEndDate() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("issueDate"), filter.getEndDate()));
            }

            if (filter.getMinAmount() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("totalAmount"), filter.getMinAmount()));
            }

            if (filter.getMaxAmount() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("totalAmount"), filter.getMaxAmount()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
