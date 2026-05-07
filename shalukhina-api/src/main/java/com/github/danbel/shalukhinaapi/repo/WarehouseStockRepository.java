package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.Warehouse;
import com.github.danbel.shalukhinaapi.domain.WarehouseStock;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseStockRepository extends JpaRepository<WarehouseStock, Long> {

    List<WarehouseStock> findAllByOrderByWarehouse_NameAscItem_NameAsc();

    Optional<WarehouseStock> findByWarehouseAndItem(Warehouse warehouse, SupplyItem item);

    List<WarehouseStock> findByItem(SupplyItem item);
}
