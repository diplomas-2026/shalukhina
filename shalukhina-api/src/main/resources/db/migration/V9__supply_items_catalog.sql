alter table supply_items
    alter column current_quantity set default 0;

alter table supply_items
    alter column current_quantity drop not null;

alter table supply_items
    alter column min_quantity set default 0;

alter table supply_items
    alter column min_quantity drop not null;

update supply_items
set current_quantity = coalesce(current_quantity, 0),
    min_quantity = coalesce(min_quantity, 0)
where current_quantity is null or min_quantity is null;
