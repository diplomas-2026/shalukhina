package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.RequestStatusHistory;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestStatusHistoryRepository extends JpaRepository<RequestStatusHistory, Long> {

    List<RequestStatusHistory> findByRequestOrderByCreatedAtAsc(SupplyRequest request);
}
