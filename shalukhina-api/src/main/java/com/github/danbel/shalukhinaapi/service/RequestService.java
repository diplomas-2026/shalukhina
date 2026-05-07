package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.Department;
import com.github.danbel.shalukhinaapi.domain.RequestPriority;
import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.RequestStatusHistory;
import com.github.danbel.shalukhinaapi.domain.StockMovement;
import com.github.danbel.shalukhinaapi.domain.StockMovementType;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.domain.SupplyRequestItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.repo.DepartmentRepository;
import com.github.danbel.shalukhinaapi.repo.RequestStatusHistoryRepository;
import com.github.danbel.shalukhinaapi.repo.StockMovementRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final SupplyRequestRepository requestRepository;
    private final SupplyItemRepository itemRepository;
    private final SystemUserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final StockMovementRepository movementRepository;
    private final RequestStatusHistoryRepository statusHistoryRepository;

    public List<SupplyRequest> listRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc();
    }

    public SupplyRequest getRequest(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new DomainNotFoundException("Request not found: " + id));
    }

    @Transactional
    public SupplyRequest createRequest(CreateRequestCommand command) {
        SystemUser requester = userRepository.findById(command.requesterId())
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + command.requesterId()));
        Department department = departmentRepository.findById(command.departmentId())
                .orElseThrow(() -> new DomainNotFoundException("Department not found: " + command.departmentId()));

        SupplyRequest request = new SupplyRequest();
        request.setRequestNumber(generateRequestNumber());
        request.setRequester(requester);
        request.setDepartment(department);
        request.setStatus(RequestStatus.SUBMITTED);
        request.setPriority(command.priority() == null ? RequestPriority.NORMAL : command.priority());
        request.setComment(command.comment());

        List<SupplyRequestItem> items = new ArrayList<>();
        for (CreateRequestItemCommand itemCommand : command.items()) {
            SupplyItem item = itemRepository.findById(itemCommand.itemId())
                    .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemCommand.itemId()));
            SupplyRequestItem requestItem = new SupplyRequestItem();
            requestItem.setRequest(request);
            requestItem.setItem(item);
            requestItem.setQuantityRequested(itemCommand.quantity());
            requestItem.setQuantityIssued(BigDecimal.ZERO);
            requestItem.setNote(itemCommand.note());
            items.add(requestItem);
        }

        request.setItems(items);
        SupplyRequest savedRequest = requestRepository.save(request);
        addStatusHistory(savedRequest, requester, RequestStatus.SUBMITTED, "Заявка создана");
        return savedRequest;
    }

    @Transactional
    public SupplyRequest updateRequest(Long requestId, Long actorId, UpdateRequestCommand command) {
        SupplyRequest request = getRequest(requestId);
        SystemUser actor = userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        if (request.getStatus() != RequestStatus.SUBMITTED) {
            throw new IllegalStateException("Only submitted requests can be edited");
        }

        boolean isOwner = request.getRequester() != null && request.getRequester().getId().equals(actorId);
        boolean isManager = actor.getRole() == com.github.danbel.shalukhinaapi.domain.UserRole.ADMIN
                || actor.getRole() == com.github.danbel.shalukhinaapi.domain.UserRole.RESPONSIBLE;
        if (!isOwner && !isManager) {
            throw new org.springframework.security.access.AccessDeniedException("No access to edit this request");
        }

        Department department = departmentRepository.findById(command.departmentId())
                .orElseThrow(() -> new DomainNotFoundException("Department not found: " + command.departmentId()));
        request.setDepartment(department);
        request.setPriority(command.priority() == null ? RequestPriority.NORMAL : command.priority());
        request.setComment(command.comment());

        request.getItems().clear();
        for (CreateRequestItemCommand itemCommand : command.items()) {
            SupplyItem item = itemRepository.findById(itemCommand.itemId())
                    .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemCommand.itemId()));
            SupplyRequestItem requestItem = new SupplyRequestItem();
            requestItem.setRequest(request);
            requestItem.setItem(item);
            requestItem.setQuantityRequested(itemCommand.quantity());
            requestItem.setQuantityIssued(BigDecimal.ZERO);
            requestItem.setNote(itemCommand.note());
            request.getItems().add(requestItem);
        }

        return requestRepository.save(request);
    }

    @Transactional
    public SupplyRequest approve(Long requestId, Long approverId, String comment) {
        SupplyRequest request = getRequest(requestId);
        SystemUser approver = userRepository.findById(approverId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + approverId));

        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(approver);
        request.setApprovedAt(Instant.now());
        if (comment != null && !comment.isBlank()) {
            request.setComment(comment);
        }
        SupplyRequest savedRequest = requestRepository.save(request);
        addStatusHistory(savedRequest, approver, RequestStatus.APPROVED, comment == null || comment.isBlank() ? "Заявка согласована" : comment);
        return savedRequest;
    }

    @Transactional
    public SupplyRequest reject(Long requestId, Long approverId, String reason) {
        SupplyRequest request = getRequest(requestId);
        SystemUser approver = userRepository.findById(approverId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + approverId));

        request.setStatus(RequestStatus.REJECTED);
        request.setApprovedBy(approver);
        request.setApprovedAt(Instant.now());
        request.setRejectionReason(reason);
        SupplyRequest savedRequest = requestRepository.save(request);
        addStatusHistory(savedRequest, approver, RequestStatus.REJECTED, reason == null || reason.isBlank() ? "Заявка отклонена" : reason);
        return savedRequest;
    }

    @Transactional
    public SupplyRequest issue(Long requestId, Long actorId, String document) {
        SupplyRequest request = getRequest(requestId);
        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalStateException("Only approved requests can be issued");
        }

        SystemUser actor = userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        for (SupplyRequestItem requestItem : request.getItems()) {
            SupplyItem item = requestItem.getItem();
            BigDecimal requested = requestItem.getQuantityRequested();
            if (item.getCurrentQuantity().compareTo(requested) < 0) {
                throw new IllegalStateException("Not enough stock for item " + item.getName());
            }
            item.setCurrentQuantity(item.getCurrentQuantity().subtract(requested));
            itemRepository.save(item);
            requestItem.setQuantityIssued(requested);

            StockMovement movement = new StockMovement();
            movement.setType(StockMovementType.ISSUE);
            movement.setItem(item);
            movement.setQuantity(requested);
            movement.setActor(actor);
            movement.setRequest(request);
            movement.setSourceDocument(document == null || document.isBlank() ? request.getRequestNumber() : document);
            movement.setComment("Issue by approved request");
            movementRepository.save(movement);
        }

        request.setStatus(RequestStatus.ISSUED);
        SupplyRequest savedRequest = requestRepository.save(request);
        addStatusHistory(savedRequest, actor, RequestStatus.ISSUED, document == null || document.isBlank() ? "Товары выданы" : document);
        return savedRequest;
    }

    private void addStatusHistory(SupplyRequest request, SystemUser actor, RequestStatus status, String note) {
        RequestStatusHistory history = new RequestStatusHistory();
        history.setRequest(request);
        history.setActor(actor);
        history.setStatus(status);
        history.setNote(note);
        statusHistoryRepository.save(history);
        request.getStatusHistory().add(history);
    }

    private String generateRequestNumber() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        String prefix = "REQ-" + today.getYear() + String.format("%02d", today.getMonthValue()) + String.format("%02d", today.getDayOfMonth());
        long count = requestRepository.count();
        return prefix + "-" + String.format("%04d", count + 1);
    }

    public record CreateRequestCommand(
            Long requesterId,
            Long departmentId,
            RequestPriority priority,
            String comment,
            List<CreateRequestItemCommand> items
    ) {
    }

    public record CreateRequestItemCommand(
            Long itemId,
            BigDecimal quantity,
            String note
    ) {
    }

    public record UpdateRequestCommand(
            Long departmentId,
            RequestPriority priority,
            String comment,
            List<CreateRequestItemCommand> items
    ) {
    }
}
