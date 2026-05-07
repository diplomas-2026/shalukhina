package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.auth.CurrentUserResolver;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.service.DomainNotFoundException;
import com.github.danbel.shalukhinaapi.service.InventoryService;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final SupplyItemRepository repository;
    private final InventoryService inventoryService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<SupplyItem> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public SupplyItem get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new DomainNotFoundException("Item not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public SupplyItem create(@RequestBody SupplyItem item) {
        return repository.save(item);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public SupplyItem update(@PathVariable Long id, @RequestBody SupplyItem payload) {
        SupplyItem item = get(id);
        item.setName(payload.getName());
        item.setSku(payload.getSku());
        item.setCategory(payload.getCategory());
        item.setUnit(payload.getUnit());
        item.setCurrentQuantity(payload.getCurrentQuantity());
        item.setMinQuantity(payload.getMinQuantity());
        item.setStorageLocation(payload.getStorageLocation());
        item.setDescription(payload.getDescription());
        item.setActive(payload.isActive());
        return repository.save(item);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public com.github.danbel.shalukhinaapi.domain.StockMovement receive(
            @PathVariable Long id,
            @RequestBody ReceiveItemCommand command,
            HttpServletRequest request
    ) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return inventoryService.receive(id, command.quantity(), currentUser.getId(), command.document(), command.comment());
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public com.github.danbel.shalukhinaapi.domain.StockMovement adjust(
            @PathVariable Long id,
            @RequestBody AdjustItemCommand command,
            HttpServletRequest request
    ) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return inventoryService.adjust(id, command.quantityDelta(), currentUser.getId(), command.document(), command.comment());
    }

    public record ReceiveItemCommand(BigDecimal quantity, Long actorId, String document, String comment) {
    }

    public record AdjustItemCommand(BigDecimal quantityDelta, Long actorId, String document, String comment) {
    }
}
