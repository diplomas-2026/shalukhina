package com.github.danbel.shalukhinaapi.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder extends BaseEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    @Column(length = 500)
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private SystemUser createdBy;

    @Column
    private Instant completedAt;

    @OneToMany(mappedBy = "purchaseOrder", fetch = FetchType.LAZY, cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("purchaseOrder")
    private List<PurchaseOrderItem> items = new ArrayList<>();
}
