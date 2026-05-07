package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.service.RequestService;
import java.util.List;
import lombok.RequiredArgsConstructor;
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

    @GetMapping
    public List<SupplyRequest> list() {
        return requestService.listRequests();
    }

    @GetMapping("/{id}")
    public SupplyRequest get(@PathVariable Long id) {
        return requestService.getRequest(id);
    }

    @PostMapping
    public SupplyRequest create(@RequestBody RequestService.CreateRequestCommand command) {
        return requestService.createRequest(command);
    }

    @PostMapping("/{id}/approve")
    public SupplyRequest approve(@PathVariable Long id, @RequestBody ApprovalCommand command) {
        return requestService.approve(id, command.actorId(), command.comment());
    }

    @PostMapping("/{id}/reject")
    public SupplyRequest reject(@PathVariable Long id, @RequestBody RejectionCommand command) {
        return requestService.reject(id, command.actorId(), command.reason());
    }

    @PostMapping("/{id}/issue")
    public SupplyRequest issue(@PathVariable Long id, @RequestBody IssueCommand command) {
        return requestService.issue(id, command.actorId(), command.document());
    }

    public record ApprovalCommand(Long actorId, String comment) {
    }

    public record RejectionCommand(Long actorId, String reason) {
    }

    public record IssueCommand(Long actorId, String document) {
    }
}
