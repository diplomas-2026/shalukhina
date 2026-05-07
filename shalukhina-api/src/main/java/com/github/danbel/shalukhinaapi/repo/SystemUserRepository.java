package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.SystemUser;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemUserRepository extends JpaRepository<SystemUser, Long> {
    Optional<SystemUser> findByUsername(String username);
}
