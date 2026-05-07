package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.Warehouse;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findAllByOrderByNameAsc();
}
