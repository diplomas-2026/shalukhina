package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import com.github.danbel.shalukhinaapi.service.DomainNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
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
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final SystemUserRepository repository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<SystemUser> list() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SystemUser get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new DomainNotFoundException("User not found: " + id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public SystemUser create(@RequestBody SystemUser user) {
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        return repository.save(user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SystemUser update(@PathVariable Long id, @RequestBody SystemUser payload) {
        SystemUser user = get(id);
        user.setFullName(payload.getFullName());
        user.setEmail(payload.getEmail());
        user.setUsername(payload.getUsername());
        if (payload.getPasswordHash() != null && !payload.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(payload.getPasswordHash()));
        }
        user.setRole(payload.getRole());
        user.setDepartment(payload.getDepartment());
        user.setPosition(payload.getPosition());
        user.setActive(payload.isActive());
        return repository.save(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
