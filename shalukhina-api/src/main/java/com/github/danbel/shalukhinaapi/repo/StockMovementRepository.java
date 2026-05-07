package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.StockMovement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findTop20ByOrderByHappenedAtDesc();
}
