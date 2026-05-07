package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplyItemRepository extends JpaRepository<SupplyItem, Long> {
    List<SupplyItem> findByActiveTrue();
}
