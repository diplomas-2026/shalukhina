package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.Warehouse;
import com.github.danbel.shalukhinaapi.repo.WarehouseRepository;
import com.github.danbel.shalukhinaapi.service.DomainNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseRepository repository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Warehouse> list() {
        return repository.findAllByOrderByNameAsc();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Warehouse get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new DomainNotFoundException("Warehouse not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Warehouse create(@RequestBody Warehouse warehouse) {
        return repository.save(warehouse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Warehouse update(@PathVariable Long id, @RequestBody Warehouse payload) {
        Warehouse warehouse = get(id);
        warehouse.setCode(payload.getCode());
        warehouse.setName(payload.getName());
        warehouse.setDescription(payload.getDescription());
        warehouse.setActive(payload.isActive());
        return repository.save(warehouse);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
