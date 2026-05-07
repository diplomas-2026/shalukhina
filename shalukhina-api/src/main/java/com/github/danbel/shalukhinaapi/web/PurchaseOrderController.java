package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.auth.CurrentUserResolver;
import com.github.danbel.shalukhinaapi.domain.PurchaseOrder;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.service.PurchaseOrderService;
import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/purchases")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public List<PurchaseOrder> list() {
        return purchaseOrderService.listOrders();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public PurchaseOrder create(@RequestBody PurchaseOrderService.CreatePurchaseOrderCommand command, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        PurchaseOrderService.CreatePurchaseOrderCommand secureCommand = new PurchaseOrderService.CreatePurchaseOrderCommand(
                currentUser.getId(),
                command.deliveryLocation(),
                command.comment(),
                command.items()
        );
        return purchaseOrderService.create(secureCommand);
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public PurchaseOrder changeStatus(@PathVariable Long id, @RequestBody PurchaseOrderService.ChangePurchaseOrderStatusCommand command, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return purchaseOrderService.changeStatus(id, currentUser.getId(), command);
    }
}
