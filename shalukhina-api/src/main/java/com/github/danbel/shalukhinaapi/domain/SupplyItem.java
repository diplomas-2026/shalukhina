package com.github.danbel.shalukhinaapi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "supply_items")
public class SupplyItem extends BaseEntity {

    @Column(nullable = false, length = 128)
    private String name;

    @Column(unique = true, length = 64)
    private String sku;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private SupplyCategory category;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal currentQuantity = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal minQuantity = BigDecimal.ZERO;

    @Column(length = 128)
    private String storageLocation;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private boolean active = true;
}
