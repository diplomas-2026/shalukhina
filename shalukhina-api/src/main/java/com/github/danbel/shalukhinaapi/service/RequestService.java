package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.Department;
import com.github.danbel.shalukhinaapi.domain.RequestPriority;
import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.RequestStatusHistory;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.domain.SupplyRequestItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.Warehouse;
import com.github.danbel.shalukhinaapi.repo.DepartmentRepository;
import com.github.danbel.shalukhinaapi.repo.RequestStatusHistoryRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import com.github.danbel.shalukhinaapi.repo.WarehouseRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
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
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final InventoryService inventoryService;
    private final WarehouseRepository warehouseRepository;

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
    public SupplyRequest changeStatus(Long requestId, Long actorId, ChangeStatusCommand command) {
        SupplyRequest request = getRequest(requestId);
        SystemUser actor = userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        if (command.status() == null) {
            throw new IllegalArgumentException("Status is required");
        }

        if (command.status() == RequestStatus.ISSUED) {
            return issueInternal(request, actor, command.warehouseId(), request.getRequestNumber(), command.note());
        }

        request.setStatus(command.status());
        if (command.status() == RequestStatus.APPROVED) {
            request.setApprovedBy(actor);
            request.setApprovedAt(Instant.now());
            request.setRejectionReason(null);
        } else if (command.status() == RequestStatus.REJECTED) {
            request.setApprovedBy(actor);
            request.setApprovedAt(Instant.now());
            request.setRejectionReason(command.note());
        } else if (command.status() == RequestStatus.ISSUED) {
            request.setApprovedBy(actor);
            request.setApprovedAt(Instant.now());
        }

        SupplyRequest savedRequest = requestRepository.save(request);
        addStatusHistory(savedRequest, actor, command.status(), command.note());
        return savedRequest;
    }

    @Transactional
    public SupplyRequest approve(Long requestId, Long approverId, String comment) {
        if (comment != null && !comment.isBlank()) {
            return changeStatus(requestId, approverId, new ChangeStatusCommand(RequestStatus.APPROVED, comment, null));
        }
        return changeStatus(requestId, approverId, new ChangeStatusCommand(RequestStatus.APPROVED, "Заявка согласована", null));
    }

    @Transactional
    public SupplyRequest reject(Long requestId, Long approverId, String reason) {
        return changeStatus(requestId, approverId, new ChangeStatusCommand(
                RequestStatus.REJECTED,
                reason == null || reason.isBlank() ? "Заявка отклонена" : reason,
                null
        ));
    }

    @Transactional
    public SupplyRequest issue(Long requestId, Long actorId, String document) {
        SupplyRequest request = getRequest(requestId);
        SystemUser actor = userRepository.findById(actorId)
                .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

        return issueInternal(request, actor, null, document, document);
    }

    private SupplyRequest issueInternal(SupplyRequest request, SystemUser actor, Long warehouseId, String document, String note) {
        if (request.getStatus() == RequestStatus.REJECTED
                || request.getStatus() == RequestStatus.CANCELLED
                || request.getStatus() == RequestStatus.ISSUED) {
            throw new IllegalStateException("Request cannot be issued in current status");
        }

        Warehouse warehouse = warehouseId == null ? resolveWarehouseForIssue(request) : warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new DomainNotFoundException("Warehouse not found: " + warehouseId));

        for (SupplyRequestItem requestItem : request.getItems()) {
            BigDecimal requested = requestItem.getQuantityRequested();
            inventoryService.decreaseStock(warehouse.getId(), requestItem.getItem().getId(), requested, actor, document, "Выдача по заявке");
            requestItem.setQuantityIssued(requested);
        }

        request.setStatus(RequestStatus.ISSUED);
        request.setApprovedBy(actor);
        request.setApprovedAt(Instant.now());
        SupplyRequest savedRequest = requestRepository.save(request);
        String historyNote = note == null || note.isBlank() ? "Товары выданы" : note;
        addStatusHistory(savedRequest, actor, RequestStatus.ISSUED, historyNote);
        return savedRequest;
    }

    private Warehouse resolveWarehouseForIssue(SupplyRequest request) {
        return warehouseRepository.findAllByOrderByNameAsc().stream()
                .filter(warehouse -> request.getItems().stream().allMatch(requestItem -> {
                    BigDecimal available = inventoryService.findStockForWarehouseAndItem(warehouse.getId(), requestItem.getItem().getId()).quantity();
                    return available.compareTo(requestItem.getQuantityRequested()) >= 0;
                }))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Нельзя перевести заявку в статус \"Выдана\": на выбранном складе недостаточно товара для полной заявки"));
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

    public record ChangeStatusCommand(
            RequestStatus status,
            String note,
            Long warehouseId
    ) {
    }
}
