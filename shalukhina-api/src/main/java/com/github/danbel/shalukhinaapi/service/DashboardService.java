package com.github.danbel.shalukhinaapi.service;

import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.StockMovement;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SupplyRequestRepository requestRepository;
    private final SupplyItemRepository itemRepository;

    public DashboardResponse getDashboard() {
        List<SupplyRequest> requests = requestRepository.findAll();
        List<SupplyItem> items = itemRepository.findAll();

        long totalRequests = requests.size();
        long submitted = requests.stream().filter(r -> r.getStatus() == RequestStatus.SUBMITTED).count();
        long approved = requests.stream().filter(r -> r.getStatus() == RequestStatus.APPROVED).count();
        long issued = requests.stream().filter(r -> r.getStatus() == RequestStatus.ISSUED).count();
        long lowStock = items.stream().filter(item -> item.getCurrentQuantity().compareTo(item.getMinQuantity()) <= 0).count();

        List<SupplyRequest> recentRequests = requests.stream()
                .sorted(Comparator.comparing(SupplyRequest::getCreatedAt).reversed())
                .limit(5)
                .toList();

        List<SupplyItem> criticalItems = items.stream()
                .sorted(Comparator.comparing(SupplyItem::getCurrentQuantity))
                .limit(5)
                .toList();

        return new DashboardResponse(totalRequests, submitted, approved, issued, lowStock, recentRequests, criticalItems);
    }

    public record DashboardResponse(
            long totalRequests,
            long submittedRequests,
            long approvedRequests,
            long issuedRequests,
            long lowStockItems,
            List<SupplyRequest> recentRequests,
            List<SupplyItem> criticalItems
    ) {
    }
}
