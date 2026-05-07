package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.Department;
import com.github.danbel.shalukhinaapi.repo.DepartmentRepository;
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
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository repository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Department> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Department get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new DomainNotFoundException("Department not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Department create(@RequestBody Department department) {
        return repository.save(department);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Department update(@PathVariable Long id, @RequestBody Department payload) {
        Department department = get(id);
        department.setCode(payload.getCode());
        department.setName(payload.getName());
        department.setActive(payload.isActive());
        return repository.save(department);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
