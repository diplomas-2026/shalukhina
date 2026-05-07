package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.SupplyCategory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplyCategoryRepository extends JpaRepository<SupplyCategory, Long> {
    Optional<SupplyCategory> findByName(String name);
}
