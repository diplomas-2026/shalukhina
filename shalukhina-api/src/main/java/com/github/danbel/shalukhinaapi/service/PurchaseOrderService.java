package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.PurchaseOrder;
import com.github.danbel.shalukhinaapi.domain.PurchaseOrderItem;
import com.github.danbel.shalukhinaapi.domain.PurchaseOrderStatus;
import com.github.danbel.shalukhinaapi.domain.StockMovement;
import com.github.danbel.shalukhinaapi.domain.StockMovementType;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.Warehouse;
import com.github.danbel.shalukhinaapi.repo.PurchaseOrderRepository;
import com.github.danbel.shalukhinaapi.repo.StockMovementRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import com.github.danbel.shalukhinaapi.repo.WarehouseRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplyItemRepository itemRepository;
    private final SystemUserRepository userRepository;
    private final WarehouseRepository warehouseRepository;
    private final StockMovementRepository movementRepository;

    public List<PurchaseOrder> listOrders() {
        return purchaseOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public PurchaseOrder create(CreatePurchaseOrderCommand command) {
        SystemUser creator = userRepository.findById(command.createdById())
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + command.createdById()));

        Warehouse deliveryWarehouse = null;
        if (command.deliveryWarehouseId() != null) {
            deliveryWarehouse = warehouseRepository.findById(command.deliveryWarehouseId())
                    .orElseThrow(() -> new DomainNotFoundException("Warehouse not found: " + command.deliveryWarehouseId()));
        }

        String deliveryLocation = command.deliveryLocation();
        if ((deliveryLocation == null || deliveryLocation.isBlank()) && deliveryWarehouse == null) {
            throw new IllegalArgumentException("Delivery warehouse is required");
        }
        if (deliveryWarehouse != null) {
            deliveryLocation = deliveryWarehouse.getName();
        }

        PurchaseOrder order = new PurchaseOrder();
        order.setOrderNumber(generateOrderNumber());
        order.setStatus(PurchaseOrderStatus.DRAFT);
        order.setComment(command.comment());
        order.setCreatedBy(creator);
        order.setDeliveryWarehouse(deliveryWarehouse);
        order.setDeliveryLocation(deliveryLocation.trim());

        List<PurchaseOrderItem> items = new ArrayList<>();
        for (CreatePurchaseOrderItemCommand itemCommand : command.items()) {
            SupplyItem item = itemRepository.findById(itemCommand.itemId())
                    .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemCommand.itemId()));
            PurchaseOrderItem orderItem = new PurchaseOrderItem();
            orderItem.setPurchaseOrder(order);
            orderItem.setItem(item);
            orderItem.setQuantityOrdered(itemCommand.quantity());
            items.add(orderItem);
        }

        order.setItems(items);
        return purchaseOrderRepository.save(order);
    }

    @Transactional
    public PurchaseOrder changeStatus(Long orderId, Long actorId, ChangePurchaseOrderStatusCommand command) {
        PurchaseOrder order = purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new DomainNotFoundException("Purchase order not found: " + orderId));
        SystemUser actor = userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        PurchaseOrderStatus previousStatus = order.getStatus();
        if (command.status() == PurchaseOrderStatus.COMPLETED && previousStatus != PurchaseOrderStatus.COMPLETED) {
            completeOrder(order, actor, command.note());
        }
        order.setStatus(command.status());
        if (command.status() == PurchaseOrderStatus.COMPLETED) {
            order.setCompletedAt(Instant.now());
        }
        return purchaseOrderRepository.save(order);
    }

    private void completeOrder(PurchaseOrder order, SystemUser actor, String note) {
        for (PurchaseOrderItem orderItem : order.getItems()) {
            SupplyItem item = orderItem.getItem();
            BigDecimal quantity = orderItem.getQuantityOrdered();
            item.setCurrentQuantity(item.getCurrentQuantity().add(quantity));
            itemRepository.save(item);

            StockMovement movement = new StockMovement();
            movement.setType(StockMovementType.RECEIPT);
            movement.setItem(item);
            movement.setQuantity(quantity);
            movement.setActor(actor);
            movement.setSourceDocument(order.getOrderNumber());
            movement.setComment(note == null || note.isBlank() ? "Поступление по закупке" : note);
            movementRepository.save(movement);
        }
    }

    private String generateOrderNumber() {
        long count = purchaseOrderRepository.count();
        return "PO-" + String.format("%05d", count + 1);
    }

    public record CreatePurchaseOrderCommand(
            Long createdById,
            Long deliveryWarehouseId,
            String deliveryLocation,
            String comment,
            List<CreatePurchaseOrderItemCommand> items
    ) {
    }

    public record CreatePurchaseOrderItemCommand(
            Long itemId,
            BigDecimal quantity
    ) {
    }

    public record ChangePurchaseOrderStatusCommand(
            PurchaseOrderStatus status,
            String note
    ) {
    }
}
