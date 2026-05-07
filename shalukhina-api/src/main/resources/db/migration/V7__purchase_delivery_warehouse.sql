alter table purchase_orders
    add column if not exists delivery_warehouse_id bigint null;

update purchase_orders po
set delivery_warehouse_id = w.id
from warehouses w
where po.delivery_warehouse_id is null
  and po.delivery_location = w.name;

alter table purchase_orders
    add constraint fk_purchase_orders_delivery_warehouse
        foreign key (delivery_warehouse_id) references warehouses (id);

create index if not exists idx_purchase_orders_delivery_warehouse_id
    on purchase_orders (delivery_warehouse_id);
