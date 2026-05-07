alter table purchase_orders
    add column if not exists delivery_location varchar(255);

update purchase_orders
set delivery_location = 'Склад МБУ Просветское'
where delivery_location is null;

alter table purchase_orders
    alter column delivery_location set not null;
