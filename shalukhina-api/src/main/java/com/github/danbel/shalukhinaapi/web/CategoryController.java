package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.SupplyCategory;
import com.github.danbel.shalukhinaapi.repo.SupplyCategoryRepository;
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
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final SupplyCategoryRepository repository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<SupplyCategory> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public SupplyCategory get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new DomainNotFoundException("Category not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SupplyCategory create(@RequestBody SupplyCategory category) {
        return repository.save(category);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SupplyCategory update(@PathVariable Long id, @RequestBody SupplyCategory payload) {
        SupplyCategory category = get(id);
        category.setName(payload.getName());
        category.setDescription(payload.getDescription());
        return repository.save(category);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
