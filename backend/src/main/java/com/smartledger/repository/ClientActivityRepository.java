package com.smartledger.repository;

import com.smartledger.model.Client;
import com.smartledger.model.ClientActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientActivityRepository extends JpaRepository<ClientActivity, Long> {
    List<ClientActivity> findByClientOrderByTimestampDesc(Client client);
}
