package com.smartledger.specification;

import com.smartledger.model.Company;
import com.smartledger.model.Expense;
import com.smartledger.model.dto.ExpenseFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ExpenseSpecification {
    
    public static Specification<Expense> filterBy(Company company, ExpenseFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(criteriaBuilder.equal(root.get("company"), company));

            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate searchVendor = criteriaBuilder.like(criteriaBuilder.lower(root.get("vendorName")), searchPattern);
                // Predicate searchCategory = criteriaBuilder.like(criteriaBuilder.lower(root.get("category").get("name")), searchPattern);
                // We'll just search vendor for simplicity or join if needed
                predicates.add(searchVendor);
            }

            if (filter.getCategoryId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), filter.getCategoryId()));
            }

            if (filter.getStartDate() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("expenseDate"), filter.getStartDate()));
            }
            
            if (filter.getEndDate() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("expenseDate"), filter.getEndDate()));
            }

            if (filter.getMinAmount() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("amount"), filter.getMinAmount()));
            }

            if (filter.getMaxAmount() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("amount"), filter.getMaxAmount()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
