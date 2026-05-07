package com.github.danbel.shalukhinaapi.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "supply_categories")
public class SupplyCategory extends BaseEntity {

    @Column(nullable = false, unique = true, length = 128)
    private String name;

    @Column(length = 255)
    private String description;
}
