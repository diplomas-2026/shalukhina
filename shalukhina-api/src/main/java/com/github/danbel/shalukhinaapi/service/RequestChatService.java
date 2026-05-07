package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.RequestChatMessage;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.UserRole;
import com.github.danbel.shalukhinaapi.repo.RequestChatMessageRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RequestChatService {

    private final SupplyRequestRepository requestRepository;
    private final RequestChatMessageRepository messageRepository;

    @Transactional(readOnly = true)
    public List<ChatMessageView> listMessages(Long requestId, SystemUser currentUser) {
        ensureAccess(requestId, currentUser);
        return messageRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                .map(ChatMessageView::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatLastView getLastMessage(Long requestId, SystemUser currentUser) {
        ensureAccess(requestId, currentUser);
        return messageRepository.findTop1ByRequestIdOrderByCreatedAtDesc(requestId)
                .map(message -> new ChatLastView(message.getId(), message.getCreatedAt()))
                .orElseGet(() -> new ChatLastView(null, null));
    }

    @Transactional
    public ChatMessageView sendMessage(Long requestId, SystemUser currentUser, String text) {
        SupplyRequest request = ensureAccess(requestId, currentUser);
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Message text cannot be empty");
        }

        RequestChatMessage message = new RequestChatMessage();
        message.setRequest(request);
        message.setSender(currentUser);
        message.setText(text.trim());
        return ChatMessageView.from(messageRepository.save(message));
    }

    private SupplyRequest ensureAccess(Long requestId, SystemUser currentUser) {
        SupplyRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new DomainNotFoundException("Request not found: " + requestId));
        if (!canAccess(request, currentUser)) {
            throw new AccessDeniedException("You cannot access this request chat");
        }
        return request;
    }

    private boolean canAccess(SupplyRequest request, SystemUser currentUser) {
        if (currentUser == null) {
            return false;
        }
        if (currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.RESPONSIBLE) {
            return true;
        }
        return request.getRequester() != null && request.getRequester().getId().equals(currentUser.getId());
    }

    public record ChatUserView(Long id, String fullName, UserRole role, String position) {
    }

    public record ChatMessageView(Long id, Instant createdAt, String text, ChatUserView sender) {
        public static ChatMessageView from(RequestChatMessage message) {
            SystemUser sender = message.getSender();
            return new ChatMessageView(
                    message.getId(),
                    message.getCreatedAt(),
                    message.getText(),
                    new ChatUserView(sender.getId(), sender.getFullName(), sender.getRole(), sender.getPosition())
            );
        }
    }

    public record ChatLastView(Long lastMessageId, Instant lastMessageAt) {
    }
}
