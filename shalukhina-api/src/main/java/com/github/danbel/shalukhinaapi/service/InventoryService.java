package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.StockMovement;
import com.github.danbel.shalukhinaapi.domain.StockMovementType;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.repo.StockMovementRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
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

    public List<SupplyItem> listItems() {
        return itemRepository.findAll();
    }

    public List<StockMovement> recentMovements() {
        return movementRepository.findTop20ByOrderByHappenedAtDesc();
    }

    @Transactional
    public StockMovement receive(Long itemId, BigDecimal quantity, Long actorId, String document, String comment) {
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        SystemUser actor = actorId == null ? null : userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        item.setCurrentQuantity(item.getCurrentQuantity().add(quantity));
        itemRepository.save(item);

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
    public StockMovement adjust(Long itemId, BigDecimal quantityDelta, Long actorId, String document, String comment) {
        SupplyItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
        SystemUser actor = actorId == null ? null : userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        item.setCurrentQuantity(item.getCurrentQuantity().add(quantityDelta));
        itemRepository.save(item);

        StockMovement movement = new StockMovement();
        movement.setType(StockMovementType.ADJUSTMENT);
        movement.setItem(item);
        movement.setQuantity(quantityDelta.abs());
        movement.setActor(actor);
        movement.setSourceDocument(document);
        movement.setComment(comment);
        return movementRepository.save(movement);
    }
}
