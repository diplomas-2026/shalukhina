package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplyRequestRepository extends JpaRepository<SupplyRequest, Long> {
    List<SupplyRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<SupplyRequest> findAllByOrderByCreatedAtDesc();

    long countByCreatedAtBetween(java.time.Instant from, java.time.Instant to);
}
