package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SupplyRequestRepository requestRepository;
    private final SupplyItemRepository itemRepository;
    private final InventoryService inventoryService;

    public DashboardResponse getDashboard() {
        List<SupplyRequest> requests = requestRepository.findAll();
        List<SupplyItem> items = itemRepository.findAll();
        Map<Long, BigDecimal> stockByItemId = inventoryService.listBalances().stream()
                .collect(Collectors.groupingBy(
                        balance -> balance.itemId(),
                        Collectors.reducing(BigDecimal.ZERO, balance -> balance.quantity(), BigDecimal::add)
                ));

        long totalRequests = requests.size();
        long submitted = requests.stream().filter(r -> r.getStatus() == RequestStatus.SUBMITTED).count();
        long approved = requests.stream().filter(r -> r.getStatus() == RequestStatus.APPROVED).count();
        long issued = requests.stream().filter(r -> r.getStatus() == RequestStatus.ISSUED).count();
        long rejected = requests.stream().filter(r -> r.getStatus() == RequestStatus.REJECTED).count();
        long lowStock = items.stream().filter(item -> stockByItemId.getOrDefault(item.getId(), BigDecimal.ZERO).compareTo(BigDecimal.ZERO) <= 0).count();

        List<SupplyRequest> recentRequests = requests.stream()
                .sorted(Comparator.comparing(SupplyRequest::getCreatedAt).reversed())
                .limit(5)
                .toList();

        List<SupplyItem> criticalItems = items.stream()
                .sorted(Comparator.comparing(item -> stockByItemId.getOrDefault(item.getId(), BigDecimal.ZERO)))
                .limit(5)
                .toList();

        return new DashboardResponse(totalRequests, submitted, approved, issued, rejected, lowStock, recentRequests, criticalItems);
    }

    public record DashboardResponse(
            long totalRequests,
            long submittedRequests,
            long approvedRequests,
            long issuedRequests,
            long rejectedRequests,
            long lowStockItems,
            List<SupplyRequest> recentRequests,
            List<SupplyItem> criticalItems
    ) {
    }
}
