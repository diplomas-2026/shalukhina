### Рисунок 2.40 - авторизация пользователя

### [Скрин кода](./img_1.png)

```java
public AuthResponse login(LoginRequest request) {
    SystemUser user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new AuthException("Неверный логин или пароль"));
    if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
        throw new AuthException("Неверный логин или пароль");
    }
    return AuthResponse.from(tokenService.createToken(user), user);
}
```

### Рисунок 2.41 - контроллер пользователей

### [Скрин кода](./img_2.png)

```java
@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public SystemUser update(@PathVariable Long id, @RequestBody SystemUser payload) {
    SystemUser user = get(id);
    user.setFullName(payload.getFullName());
    user.setEmail(payload.getEmail());
    user.setUsername(payload.getUsername());
    if (payload.getPasswordHash() != null && !payload.getPasswordHash().isBlank()) {
        user.setPasswordHash(passwordEncoder.encode(payload.getPasswordHash()));
    }
    user.setRole(payload.getRole());
    user.setDepartment(payload.getDepartment());
    user.setPosition(payload.getPosition());
    user.setActive(payload.isActive());
    return repository.save(user);
}
```

### Рисунок 2.42 - контроллер заявок

### [Скрин кода](./img_3.png)

```java
@PostMapping
@PreAuthorize("isAuthenticated()")
public SupplyRequest create(@RequestBody RequestService.CreateRequestCommand command, HttpServletRequest request) {
    SystemUser currentUser = currentUserResolver.requireUser(request);
    RequestService.CreateRequestCommand secureCommand = new RequestService.CreateRequestCommand(
            currentUser.getId(),
            command.departmentId(),
            command.priority(),
            command.comment(),
            command.items()
    );
    return requestService.createRequest(secureCommand);
}
```

### Рисунок 2.43 - сервис позиций заявки

### [Скрин кода](./img_4.png)

```java
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
```

### Рисунок 2.44 - история статусов заявки

### [Скрин кода](./img_5.png)

```java
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
```

### Рисунок 2.45 - складские операции

### [Скрин кода](./img_6.png)

```java
@Transactional
public void decreaseStock(Long warehouseId, Long itemId, BigDecimal quantity, SystemUser actor, String document, String comment) {
    SupplyItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
    Warehouse warehouse = resolveWarehouse(warehouseId);
    WarehouseStock stock = getOrCreateStock(warehouse, item);
    if (stock.getQuantity().compareTo(quantity) < 0) {
        throw new IllegalStateException("Нельзя перевести заявку в статус \"Выдана\": на складе \"" + warehouse.getName() + "\" недостаточно товара \"" + item.getName() + "\"");
    }
    stock.setQuantity(stock.getQuantity().subtract(quantity));
    warehouseStockRepository.save(stock);

    StockMovement movement = new StockMovement();
    movement.setType(StockMovementType.ISSUE);
    movement.setItem(item);
    movement.setQuantity(quantity);
    movement.setActor(actor);
    movement.setSourceDocument(document);
    movement.setComment(comment);
    movementRepository.save(movement);
}
```

### Рисунок 2.46 - модуль закупок

### [Скрин кода](./img_7.png)

```java
@Transactional
public PurchaseOrder create(CreatePurchaseOrderCommand command) {
    SystemUser creator = userRepository.findById(command.createdById())
            .orElseThrow(() -> new DomainNotFoundException("User not found: " + command.createdById()));

    Warehouse deliveryWarehouse = null;
    if (command.deliveryWarehouseId() != null) {
        deliveryWarehouse = warehouseRepository.findById(command.deliveryWarehouseId())
                .orElseThrow(() -> new DomainNotFoundException("Warehouse not found: " + command.deliveryWarehouseId()));
    }

    String deliveryLocation = command.deliveryLocation();
    if ((deliveryLocation == null || deliveryLocation.isBlank()) && deliveryWarehouse == null) {
        throw new IllegalArgumentException("Delivery warehouse is required");
    }
    if (deliveryWarehouse != null) {
        deliveryLocation = deliveryWarehouse.getName();
    }

    PurchaseOrder order = new PurchaseOrder();
    order.setOrderNumber(generateOrderNumber());
    order.setStatus(PurchaseOrderStatus.DRAFT);
    order.setComment(command.comment());
    order.setCreatedBy(creator);
    order.setDeliveryWarehouse(deliveryWarehouse);
    order.setDeliveryLocation(deliveryLocation.trim());

    List<PurchaseOrderItem> items = new ArrayList<>();
    for (CreatePurchaseOrderItemCommand itemCommand : command.items()) {
        SupplyItem item = itemRepository.findById(itemCommand.itemId())
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemCommand.itemId()));
        PurchaseOrderItem orderItem = new PurchaseOrderItem();
        orderItem.setPurchaseOrder(order);
        orderItem.setItem(item);
        orderItem.setQuantityOrdered(itemCommand.quantity());
        items.add(orderItem);
    }

    order.setItems(items);
    return purchaseOrderRepository.save(order);
}
```

### Рисунок 2.47 - формирование Excel-отчета

### [Скрин кода](./img_8.png)

```javascript
const exportFullReport = () => {
  downloadWorkbook('otchet-polnyj.xlsx', {
    'Заявки': state.requests.map((request) => ({
      'Номер': request.requestNumber,
      'Статус': requestStatusLabels[request.status] || request.status,
      'Кто подал': request.requester?.fullName || '',
      'Кабинет / отдел': request.department?.name || '',
      'Приоритет': priorityLabels[request.priority] || request.priority,
      'Позиций': request.items?.length || 0,
      'Дата создания': formatDateTime(request.createdAt),
    })),
    'Склад': stockBalances.map((stock) => ({
      'Склад': stock.warehouseName || '',
      'Товар': stock.itemName || '',
      'SKU': stock.itemSku || '',
      'Категория': stock.categoryName || '',
      'Остаток': Number(stock.quantity || 0),
      'Ед. изм.': stock.itemUnit || '',
    })),
    'Закупки': state.purchases.map((purchase) => ({
      'Номер': purchase.orderNumber,
      'Статус': purchaseStatusLabels[purchase.status] || purchase.status,
      'Склад доставки': purchase.deliveryWarehouse?.name || purchase.deliveryLocation || '',
      'Позиции': purchase.items?.length || 0,
    })),
    'Движение': state.movements.map((movement) => ({
      'Дата': formatDateTime(movement.happenedAt),
      'Тип': movementTypeLabels[movement.type] || movement.type,
      'Товар': movement.item?.name || '',
      'Количество': Number(movement.quantity || 0),
    })),
  });
};
```

### Листинг кода программного продукта страниц на 3-4.

```java
public AuthResponse login(LoginRequest request) {
    SystemUser user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new AuthException("Неверный логин или пароль"));
    if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
        throw new AuthException("Неверный логин или пароль");
    }
    return AuthResponse.from(tokenService.createToken(user), user);
}

public Optional<SystemUser> findUserByPrincipal(TokenService.TokenPrincipal principal) {
    if (principal == null) {
        return Optional.empty();
    }
    return userRepository.findById(principal.userId()).filter(SystemUser::isActive);
}

@PutMapping("/{id}")
@PreAuthorize("hasRole('ADMIN')")
public SystemUser update(@PathVariable Long id, @RequestBody SystemUser payload) {
    SystemUser user = get(id);
    user.setFullName(payload.getFullName());
    user.setEmail(payload.getEmail());
    user.setUsername(payload.getUsername());
    if (payload.getPasswordHash() != null && !payload.getPasswordHash().isBlank()) {
        user.setPasswordHash(passwordEncoder.encode(payload.getPasswordHash()));
    }
    user.setRole(payload.getRole());
    user.setDepartment(payload.getDepartment());
    user.setPosition(payload.getPosition());
    user.setActive(payload.isActive());
    return repository.save(user);
}

@PostMapping
@PreAuthorize("isAuthenticated()")
public SupplyRequest create(@RequestBody RequestService.CreateRequestCommand command, HttpServletRequest request) {
    SystemUser currentUser = currentUserResolver.requireUser(request);
    RequestService.CreateRequestCommand secureCommand = new RequestService.CreateRequestCommand(
            currentUser.getId(),
            command.departmentId(),
            command.priority(),
            command.comment(),
            command.items()
    );
    return requestService.createRequest(secureCommand);
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

private void addStatusHistory(SupplyRequest request, SystemUser actor, RequestStatus status, String note) {
    RequestStatusHistory history = new RequestStatusHistory();
    history.setRequest(request);
    history.setActor(actor);
    history.setStatus(status);
    history.setNote(note);
    statusHistoryRepository.save(history);
    request.getStatusHistory().add(history);
}

@Transactional
public void decreaseStock(Long warehouseId, Long itemId, BigDecimal quantity, SystemUser actor, String document, String comment) {
    SupplyItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
    Warehouse warehouse = resolveWarehouse(warehouseId);
    WarehouseStock stock = getOrCreateStock(warehouse, item);
    if (stock.getQuantity().compareTo(quantity) < 0) {
        throw new IllegalStateException("Нельзя перевести заявку в статус \"Выдана\": на складе \"" + warehouse.getName() + "\" недостаточно товара \"" + item.getName() + "\"");
    }
    stock.setQuantity(stock.getQuantity().subtract(quantity));
    warehouseStockRepository.save(stock);

    StockMovement movement = new StockMovement();
    movement.setType(StockMovementType.ISSUE);
    movement.setItem(item);
    movement.setQuantity(quantity);
    movement.setActor(actor);
    movement.setSourceDocument(document);
    movement.setComment(comment);
    movementRepository.save(movement);
}

@Transactional
public void increaseStock(Long warehouseId, Long itemId, BigDecimal quantity, SystemUser actor, String document, String comment) {
    SupplyItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemId));
    Warehouse warehouse = resolveWarehouse(warehouseId);
    addToWarehouseStock(warehouse, item, quantity);

    StockMovement movement = new StockMovement();
    movement.setType(StockMovementType.RECEIPT);
    movement.setItem(item);
    movement.setQuantity(quantity);
    movement.setActor(actor);
    movement.setSourceDocument(document);
    movement.setComment(comment);
    movementRepository.save(movement);
}

@Transactional
public PurchaseOrder create(CreatePurchaseOrderCommand command) {
    SystemUser creator = userRepository.findById(command.createdById())
            .orElseThrow(() -> new DomainNotFoundException("User not found: " + command.createdById()));

    Warehouse deliveryWarehouse = null;
    if (command.deliveryWarehouseId() != null) {
        deliveryWarehouse = warehouseRepository.findById(command.deliveryWarehouseId())
                .orElseThrow(() -> new DomainNotFoundException("Warehouse not found: " + command.deliveryWarehouseId()));
    }

    String deliveryLocation = command.deliveryLocation();
    if ((deliveryLocation == null || deliveryLocation.isBlank()) && deliveryWarehouse == null) {
        throw new IllegalArgumentException("Delivery warehouse is required");
    }
    if (deliveryWarehouse != null) {
        deliveryLocation = deliveryWarehouse.getName();
    }

    PurchaseOrder order = new PurchaseOrder();
    order.setOrderNumber(generateOrderNumber());
    order.setStatus(PurchaseOrderStatus.DRAFT);
    order.setComment(command.comment());
    order.setCreatedBy(creator);
    order.setDeliveryWarehouse(deliveryWarehouse);
    order.setDeliveryLocation(deliveryLocation.trim());

    List<PurchaseOrderItem> items = new ArrayList<>();
    for (CreatePurchaseOrderItemCommand itemCommand : command.items()) {
        SupplyItem item = itemRepository.findById(itemCommand.itemId())
                .orElseThrow(() -> new DomainNotFoundException("Item not found: " + itemCommand.itemId()));
        PurchaseOrderItem orderItem = new PurchaseOrderItem();
        orderItem.setPurchaseOrder(order);
        orderItem.setItem(item);
        orderItem.setQuantityOrdered(itemCommand.quantity());
        items.add(orderItem);
    }

    order.setItems(items);
    return purchaseOrderRepository.save(order);
}

@Transactional
public PurchaseOrder changeStatus(Long orderId, Long actorId, ChangePurchaseOrderStatusCommand command) {
    PurchaseOrder order = purchaseOrderRepository.findById(orderId)
            .orElseThrow(() -> new DomainNotFoundException("Purchase order not found: " + orderId));
    SystemUser actor = userRepository.findById(actorId)
            .orElseThrow(() -> new DomainNotFoundException("User not found: " + actorId));

    PurchaseOrderStatus previousStatus = order.getStatus();
    if (command.status() == PurchaseOrderStatus.COMPLETED && previousStatus != PurchaseOrderStatus.COMPLETED) {
        completeOrder(order, actor, command.note());
    }
    order.setStatus(command.status());
    if (command.status() == PurchaseOrderStatus.COMPLETED) {
        order.setCompletedAt(Instant.now());
    }
    return purchaseOrderRepository.save(order);
}
```
