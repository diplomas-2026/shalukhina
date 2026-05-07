package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.auth.CurrentUserResolver;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.service.RequestChatService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/requests/{requestId}/chat")
@RequiredArgsConstructor
public class RequestChatController {

    private final RequestChatService chatService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<RequestChatService.ChatMessageView> list(@PathVariable Long requestId, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return chatService.listMessages(requestId, currentUser);
    }

    @GetMapping("/last")
    @PreAuthorize("isAuthenticated()")
    public RequestChatService.ChatLastView last(@PathVariable Long requestId, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return chatService.getLastMessage(requestId, currentUser);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public RequestChatService.ChatMessageView send(
            @PathVariable Long requestId,
            @RequestBody SendMessageCommand command,
            HttpServletRequest request
    ) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return chatService.sendMessage(requestId, currentUser, command.text());
    }

    public record SendMessageCommand(String text) {
    }
}
