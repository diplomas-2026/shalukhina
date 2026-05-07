package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.PurchaseOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
}
