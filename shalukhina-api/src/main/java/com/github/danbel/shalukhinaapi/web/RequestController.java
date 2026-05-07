package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.auth.CurrentUserResolver;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.service.RequestService;
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
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;
    private final CurrentUserResolver currentUserResolver;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<SupplyRequest> list() {
        return requestService.listRequests();
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public SupplyRequest get(@PathVariable Long id) {
        return requestService.getRequest(id);
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public SupplyRequest create(@RequestBody RequestService.CreateRequestCommand command, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        RequestService.CreateRequestCommand secureCommand = new RequestService.CreateRequestCommand(
                currentUser.getId(),
                command.departmentId(),
                command.priority(),
                command.comment(),
                command.items()
        );
        return requestService.createRequest(secureCommand);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public SupplyRequest approve(@PathVariable Long id, @RequestBody ApprovalCommand command, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return requestService.approve(id, currentUser.getId(), command.comment());
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public SupplyRequest reject(@PathVariable Long id, @RequestBody RejectionCommand command, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return requestService.reject(id, currentUser.getId(), command.reason());
    }

    @PostMapping("/{id}/issue")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSIBLE')")
    public SupplyRequest issue(@PathVariable Long id, @RequestBody IssueCommand command, HttpServletRequest request) {
        SystemUser currentUser = currentUserResolver.requireUser(request);
        return requestService.issue(id, currentUser.getId(), command.document());
    }

    public record ApprovalCommand(Long actorId, String comment) {
    }

    public record RejectionCommand(Long actorId, String reason) {
    }

    public record IssueCommand(Long actorId, String document) {
    }
}
