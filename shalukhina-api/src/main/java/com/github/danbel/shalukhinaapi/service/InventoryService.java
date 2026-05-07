package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.StockMovement;
import com.github.danbel.shalukhinaapi.domain.StockMovementType;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.Warehouse;
import com.github.danbel.shalukhinaapi.domain.WarehouseStock;
import com.github.danbel.shalukhinaapi.repo.StockMovementRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import com.github.danbel.shalukhinaapi.repo.WarehouseRepository;
import com.github.danbel.shalukhinaapi.repo.WarehouseStockRepository;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final SupplyItemRepository itemRepository;
    private final StockMovementRepository movementRepository;
    private final SystemUserRepository userRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseStockRepository warehouseStockRepository;

    @Transactional(readOnly = true)
    public List<SupplyItem> listItems() {
        return itemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<WarehouseStockView> listBalances() {
        return warehouseStockRepository.findAllByOrderByWarehouse_NameAscItem_NameAsc().stream()
                .map(stock -> new WarehouseStockView(
                        stock.getId(),
                        stock.getWarehouse().getId(),
                        stock.getWarehouse().getName(),
                        stock.getItem().getId(),
                        stock.getItem().getName(),
                        stock.getItem().getSku(),
                        stock.getItem().getUnit(),
                        stock.getItem().getCategory() == null ? null : stock.getItem().getCategory().getName(),
                        stock.getQuantity()
                ))
                .toList();
    }

    public List<StockMovement> recentMovements() {
        return movementRepository.findTop20ByOrderByHappenedAtDesc();
    }

    @Transactional
    public StockMovement receive(Long itemId, Long warehouseId, BigDecimal quantity, Long actorId, String document, String comment) {
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        Warehouse warehouse = resolveWarehouse(warehouseId);
        SystemUser actor = actorId == null ? null : userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        addToWarehouseStock(warehouse, item, quantity);

        StockMovement movement = new StockMovement();
        movement.setType(StockMovementType.RECEIPT);
        movement.setItem(item);
        movement.setQuantity(quantity);
        movement.setActor(actor);
        movement.setSourceDocument(document);
        movement.setComment(comment);
        return movementRepository.save(movement);
    }

    @Transactional
    public StockMovement adjust(Long itemId, Long warehouseId, BigDecimal quantityDelta, Long actorId, String document, String comment) {
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        Warehouse warehouse = resolveWarehouse(warehouseId);
        SystemUser actor = actorId == null ? null : userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        WarehouseStock stock = getOrCreateStock(warehouse, item);
        stock.setQuantity(stock.getQuantity().add(quantityDelta));
        if (stock.getQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Нельзя списать больше, чем есть на складе");
        }
        warehouseStockRepository.save(stock);

        StockMovement movement = new StockMovement();
        movement.setType(StockMovementType.ADJUSTMENT);
        movement.setItem(item);
        movement.setQuantity(quantityDelta.abs());
        movement.setActor(actor);
        movement.setSourceDocument(document);
        movement.setComment(comment);
        return movementRepository.save(movement);
    }

    @Transactional
    public void increaseStock(Long warehouseId, Long itemId, BigDecimal quantity, SystemUser actor, String document, String comment) {
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        Warehouse warehouse = resolveWarehouse(warehouseId);
        addToWarehouseStock(warehouse, item, quantity);

        StockMovement movement = new StockMovement();
        movement.setType(StockMovementType.RECEIPT);
        movement.setItem(item);
        movement.setQuantity(quantity);
        movement.setActor(actor);
        movement.setSourceDocument(document);
        movement.setComment(comment);
        movementRepository.save(movement);
    }

    @Transactional
    public void decreaseStock(Long warehouseId, Long itemId, BigDecimal quantity, SystemUser actor, String document, String comment) {
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        Warehouse warehouse = resolveWarehouse(warehouseId);
        WarehouseStock stock = getOrCreateStock(warehouse, item);
        if (stock.getQuantity().compareTo(quantity) < 0) {
            throw new IllegalStateException("Нельзя перевести заявку в статус \"Выдана\": на складе \"" + warehouse.getName() + "\" недостаточно товара \"" + item.getName() + "\"");
        }
        stock.setQuantity(stock.getQuantity().subtract(quantity));
        warehouseStockRepository.save(stock);

        StockMovement movement = new StockMovement();
        movement.setType(StockMovementType.ISSUE);
        movement.setItem(item);
        movement.setQuantity(quantity);
        movement.setActor(actor);
        movement.setSourceDocument(document);
        movement.setComment(comment);
        movementRepository.save(movement);
    }

    public BigDecimal totalQuantityForItem(Long itemId) {
        return warehouseStockRepository.findByItem(itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId)))
                .stream()
                .map(WarehouseStock::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public WarehouseStockView findStockForWarehouseAndItem(Long warehouseId, Long itemId) {
        Warehouse warehouse = resolveWarehouse(warehouseId);
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        return warehouseStockRepository.findByWarehouseAndItem(warehouse, item)
                .map(stock -> new WarehouseStockView(
                        stock.getId(),
                        stock.getWarehouse().getId(),
                        stock.getWarehouse().getName(),
                        stock.getItem().getId(),
                        stock.getItem().getName(),
                        stock.getItem().getSku(),
                        stock.getItem().getUnit(),
                        stock.getItem().getCategory() == null ? null : stock.getItem().getCategory().getName(),
                        stock.getQuantity()
                ))
                .orElse(new WarehouseStockView(
                        null,
                        warehouse.getId(),
                        warehouse.getName(),
                        item.getId(),
                        item.getName(),
                        item.getSku(),
                        item.getUnit(),
                        item.getCategory() == null ? null : item.getCategory().getName(),
                        BigDecimal.ZERO
                ));
    }

    private Warehouse resolveWarehouse(Long warehouseId) {
        if (warehouseId == null) {
            return warehouseRepository.findAllByOrderByNameAsc().stream()
                    .findFirst()
                    .orElseThrow(() -> new DomainNotFoundException("Warehouse not found"));
        }
        return warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new DomainNotFoundException("Warehouse not found: " + warehouseId));
    }

    private WarehouseStock getOrCreateStock(Warehouse warehouse, SupplyItem item) {
        return warehouseStockRepository.findByWarehouseAndItem(warehouse, item)
                .orElseGet(() -> {
                    WarehouseStock stock = new WarehouseStock();
                    stock.setWarehouse(warehouse);
                    stock.setItem(item);
                    stock.setQuantity(BigDecimal.ZERO);
                    return stock;
                });
    }

    private void addToWarehouseStock(Warehouse warehouse, SupplyItem item, BigDecimal quantity) {
        WarehouseStock stock = getOrCreateStock(warehouse, item);
        stock.setQuantity(stock.getQuantity().add(quantity));
        warehouseStockRepository.save(stock);
    }

    public record WarehouseStockView(
            Long id,
            Long warehouseId,
            String warehouseName,
            Long itemId,
            String itemName,
            String itemSku,
            String itemUnit,
            String categoryName,
            BigDecimal quantity
    ) {
    }
}
