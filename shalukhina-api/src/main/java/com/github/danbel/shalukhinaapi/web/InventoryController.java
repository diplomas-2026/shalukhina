package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.StockMovement;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.service.InventoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/items")
    @PreAuthorize("isAuthenticated()")
    public List<SupplyItem> items() {
        return inventoryService.listItems();
    }

    @GetMapping("/movements")
    @PreAuthorize("isAuthenticated()")
    public List<StockMovement> movements() {
        return inventoryService.recentMovements();
    }
}
