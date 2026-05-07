package com.github.danbel.shalukhinaapi.repo;

import com.github.danbel.shalukhinaapi.domain.RequestChatMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestChatMessageRepository extends JpaRepository<RequestChatMessage, Long> {
    List<RequestChatMessage> findByRequestIdOrderByCreatedAtAsc(Long requestId);

    Optional<RequestChatMessage> findTop1ByRequestIdOrderByCreatedAtDesc(Long requestId);
}
