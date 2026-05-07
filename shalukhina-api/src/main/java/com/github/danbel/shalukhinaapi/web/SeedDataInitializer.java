package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.Department;
import com.github.danbel.shalukhinaapi.domain.RequestPriority;
import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.PurchaseOrder;
import com.github.danbel.shalukhinaapi.domain.PurchaseOrderStatus;
import com.github.danbel.shalukhinaapi.domain.SupplyCategory;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.RequestChatMessage;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.domain.SupplyRequestItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.UserRole;
import com.github.danbel.shalukhinaapi.domain.Warehouse;
import com.github.danbel.shalukhinaapi.repo.DepartmentRepository;
import com.github.danbel.shalukhinaapi.repo.RequestChatMessageRepository;
import com.github.danbel.shalukhinaapi.repo.PurchaseOrderRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyCategoryRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import com.github.danbel.shalukhinaapi.repo.WarehouseRepository;
import com.github.danbel.shalukhinaapi.service.InventoryService;
import com.github.danbel.shalukhinaapi.service.RequestService;
import com.github.danbel.shalukhinaapi.service.PurchaseOrderService;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
@RequiredArgsConstructor
public class SeedDataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final SystemUserRepository userRepository;
    private final SupplyCategoryRepository categoryRepository;
    private final SupplyItemRepository itemRepository;
    private final SupplyRequestRepository requestRepository;
    private final RequestChatMessageRepository chatMessageRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final RequestService requestService;
    private final PurchaseOrderService purchaseOrderService;
    private final InventoryService inventoryService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0 && userRepository.count() == 0 && itemRepository.count() == 0) {
            seedBaseData();
        }

        if (chatMessageRepository.count() == 0) {
            seedChatData();
        }

        if (purchaseOrderRepository.count() == 0) {
            seedPurchaseData();
        }
    }

    private void seedBaseData() {
        Department adminDepartment = new Department();
        adminDepartment.setCode("ADMIN");
        adminDepartment.setName("Администрация");
        departmentRepository.save(adminDepartment);

        Department servicesDepartment = new Department();
        servicesDepartment.setCode("SERV");
        servicesDepartment.setName("Служебные подразделения");
        departmentRepository.save(servicesDepartment);

        Department accountingDepartment = new Department();
        accountingDepartment.setCode("ACC");
        accountingDepartment.setName("Бухгалтерия");
        departmentRepository.save(accountingDepartment);

        Department cultureDepartment = new Department();
        cultureDepartment.setCode("CUL");
        cultureDepartment.setName("Культурно-досуговый отдел");
        departmentRepository.save(cultureDepartment);

        SystemUser admin = new SystemUser();
        admin.setFullName("Администратор системы");
        admin.setEmail("admin@prosvet.ru");
        admin.setUsername("admin");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setRole(UserRole.ADMIN);
        admin.setDepartment(adminDepartment);
        admin.setPosition("Администратор");
        userRepository.save(admin);

        SystemUser employee = new SystemUser();
        employee.setFullName("Иван Петров");
        employee.setEmail("ivan.petrov@prosvet.ru");
        employee.setUsername("ipetrov");
        employee.setPasswordHash(passwordEncoder.encode("employee123"));
        employee.setRole(UserRole.EMPLOYEE);
        employee.setDepartment(servicesDepartment);
        employee.setPosition("Специалист");
        userRepository.save(employee);

        SystemUser employee2 = new SystemUser();
        employee2.setFullName("Елена Кузнецова");
        employee2.setEmail("elena.kuznetsova@prosvet.ru");
        employee2.setUsername("ekuznetsova");
        employee2.setPasswordHash(passwordEncoder.encode("employee456"));
        employee2.setRole(UserRole.EMPLOYEE);
        employee2.setDepartment(cultureDepartment);
        employee2.setPosition("Методист");
        userRepository.save(employee2);

        SystemUser responsible = new SystemUser();
        responsible.setFullName("Ольга Сидорова");
        responsible.setEmail("olga.sidorova@prosvet.ru");
        responsible.setUsername("osidorova");
        responsible.setPasswordHash(passwordEncoder.encode("responsible123"));
        responsible.setRole(UserRole.RESPONSIBLE);
        responsible.setDepartment(adminDepartment);
        responsible.setPosition("Ответственный за заявки и склад");
        userRepository.save(responsible);

        SystemUser accountant = new SystemUser();
        accountant.setFullName("Марина Ильина");
        accountant.setEmail("marina.ilina@prosvet.ru");
        accountant.setUsername("milina");
        accountant.setPasswordHash(passwordEncoder.encode("account123"));
        accountant.setRole(UserRole.RESPONSIBLE);
        accountant.setDepartment(accountingDepartment);
        accountant.setPosition("Бухгалтер");
        userRepository.save(accountant);

        SystemUser director = new SystemUser();
        director.setFullName("Сергей Иванов");
        director.setEmail("sergey.ivanov@prosvet.ru");
        director.setUsername("sivanov");
        director.setPasswordHash(passwordEncoder.encode("director123"));
        director.setRole(UserRole.ADMIN);
        director.setDepartment(adminDepartment);
        director.setPosition("Директор");
        userRepository.save(director);

        SupplyCategory paper = new SupplyCategory();
        paper.setName("Бумага и блокноты");
        paper.setDescription("Бумажная продукция");
        categoryRepository.save(paper);

        SupplyCategory writing = new SupplyCategory();
        writing.setName("Письменные принадлежности");
        writing.setDescription("Ручки, карандаши, маркеры");
        categoryRepository.save(writing);

        SupplyCategory filing = new SupplyCategory();
        filing.setName("Организация документов");
        filing.setDescription("Папки, файлы, скрепление");
        categoryRepository.save(filing);

        SupplyCategory presentation = new SupplyCategory();
        presentation.setName("Презентационные материалы");
        presentation.setDescription("Маркерные доски, флипчарты, стикеры для совещаний");
        categoryRepository.save(presentation);

        Warehouse mainWarehouse = buildWarehouse("WH-MAIN", "Основной склад", "Главный склад канцтоваров");
        Warehouse reserveWarehouse = buildWarehouse("WH-RESERVE", "Резервный склад", "Резерв для экстренного пополнения");
        Warehouse schoolWarehouse = buildWarehouse("WH-SCHOOL", "Школьный склад", "Склад для выдачи по кабинетам");
        warehouseRepository.saveAll(List.of(mainWarehouse, reserveWarehouse, schoolWarehouse));

        List<SupplyItem> items = itemRepository.saveAll(List.of(
                buildItem("Бумага A4", "A4-001", paper, "пачка"),
                buildItem("Ручка шариковая синяя", "PEN-002", writing, "шт"),
                buildItem("Карандаш HB", "PEN-003", writing, "шт"),
                buildItem("Папка-скоросшиватель", "FIL-004", filing, "шт"),
                buildItem("Файл прозрачный", "FIL-005", filing, "шт"),
                buildItem("Стикеры", "OFF-006", paper, "упак"),
                buildItem("Маркеры для доски", "PRES-007", presentation, "набор"),
                buildItem("Блокнот А5", "NOTE-008", paper, "шт")
        ));

        inventoryService.increaseStock(mainWarehouse.getId(), items.get(0).getId(), new BigDecimal("48"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(mainWarehouse.getId(), items.get(1).getId(), new BigDecimal("180"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(schoolWarehouse.getId(), items.get(2).getId(), new BigDecimal("96"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(reserveWarehouse.getId(), items.get(3).getId(), new BigDecimal("64"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(reserveWarehouse.getId(), items.get(4).getId(), new BigDecimal("240"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(mainWarehouse.getId(), items.get(5).getId(), new BigDecimal("18"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(schoolWarehouse.getId(), items.get(6).getId(), new BigDecimal("22"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(mainWarehouse.getId(), items.get(7).getId(), new BigDecimal("35"), admin, "Стартовый остаток", "Начальное наполнение склада");
        inventoryService.increaseStock(mainWarehouse.getId(), items.get(6).getId(), new BigDecimal("10"), admin, "Стартовый остаток", "Начальное наполнение склада");

        createSeedRequest(employee, servicesDepartment, RequestPriority.NORMAL, "Запрос на текущую неделю", List.of(
                new RequestLine(items.get(0), new BigDecimal("2"), "Для принтера"),
                new RequestLine(items.get(1), new BigDecimal("10"), "Для сотрудников")
        ));

        SupplyRequest issuedRequest = createSeedRequest(employee2, cultureDepartment, RequestPriority.HIGH, "Подготовка к мероприятию", List.of(
                new RequestLine(items.get(6), new BigDecimal("5"), "Для совещания"),
                new RequestLine(items.get(7), new BigDecimal("8"), "Для раздачи участникам")
        ));
        requestService.approve(issuedRequest.getId(), accountant.getId(), "Согласовано бухгалтерией");
        requestService.issue(issuedRequest.getId(), accountant.getId(), issuedRequest.getRequestNumber());

        createSeedRequest(employee, accountingDepartment, RequestPriority.URGENT, "Срочное пополнение канцелярии", List.of(
                new RequestLine(items.get(3), new BigDecimal("12"), "Для архива"),
                new RequestLine(items.get(4), new BigDecimal("40"), "Для делопроизводства")
        ));

        SupplyRequest rejectedRequest = createSeedRequest(employee2, cultureDepartment, RequestPriority.LOW, "Непрофильный запрос", List.of(
                new RequestLine(items.get(2), new BigDecimal("3"), "Не актуально")
        ));
        requestService.reject(rejectedRequest.getId(), responsible.getId(), "Отложено до следующего периода");

        inventoryService.increaseStock(mainWarehouse.getId(), items.get(0).getId(), new BigDecimal("20"), admin, "Поступление №15", "Поставка от поставщика");
        inventoryService.increaseStock(mainWarehouse.getId(), items.get(1).getId(), new BigDecimal("50"), accountant, "Поступление №16", "Пополнение шариковых ручек");
        inventoryService.increaseStock(schoolWarehouse.getId(), items.get(6).getId(), new BigDecimal("12"), responsible, "Поступление №17", "Маркерные наборы");
        inventoryService.adjust(items.get(0).getId(), mainWarehouse.getId(), new BigDecimal("4"), responsible.getId(), "Инвентаризация", "Корректировка по итогам сверки");
    }

    private void seedChatData() {
        SupplyRequest issuedRequest = requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.ISSUED).stream().findFirst().orElse(null);
        SupplyRequest rejectedRequest = requestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.REJECTED).stream().findFirst().orElse(null);
        SystemUser employee = userRepository.findByUsername("ekuznetsova").orElse(null);
        SystemUser accountant = userRepository.findByUsername("milina").orElse(null);
        SystemUser responsible = userRepository.findByUsername("osidorova").orElse(null);

        if (issuedRequest != null && employee != null && accountant != null) {
            chatMessageRepository.save(buildChatMessage(issuedRequest, employee, "Подскажите, пожалуйста, когда примерно можно получить канцтовары?"));
            chatMessageRepository.save(buildChatMessage(issuedRequest, accountant, "Заявка согласована, можно выдавать сегодня после обеда."));
        }

        if (rejectedRequest != null && employee != null && responsible != null) {
            chatMessageRepository.save(buildChatMessage(rejectedRequest, employee, "Поняла, вернусь к этому запросу позже."));
            chatMessageRepository.save(buildChatMessage(rejectedRequest, responsible, "Да, после обновления бюджета рассмотрим повторно."));
        }
    }

    private void seedPurchaseData() {
        SystemUser responsible = userRepository.findByUsername("osidorova").orElse(null);
        SystemUser accountant = userRepository.findByUsername("milina").orElse(null);
        SystemUser admin = userRepository.findByUsername("admin").orElse(null);
        Warehouse deliveryWarehouse = warehouseRepository.findAllByOrderByNameAsc().stream().findFirst().orElse(null);
        List<SupplyItem> items = itemRepository.findAll();

        if (responsible == null || accountant == null || admin == null || deliveryWarehouse == null || items.size() < 4) {
            return;
        }

        PurchaseOrder draft = purchaseOrderService.create(new PurchaseOrderService.CreatePurchaseOrderCommand(
                responsible.getId(),
                deliveryWarehouse.getId(),
                "Склад МБУ Просветское",
                "Черновик закупки для канцелярии",
                List.of(
                        new PurchaseOrderService.CreatePurchaseOrderItemCommand(items.get(0).getId(), new BigDecimal("25")),
                        new PurchaseOrderService.CreatePurchaseOrderItemCommand(items.get(1).getId(), new BigDecimal("60"))
                )
        ));

        purchaseOrderService.changeStatus(draft.getId(), responsible.getId(), new PurchaseOrderService.ChangePurchaseOrderStatusCommand(
                PurchaseOrderStatus.DRAFT,
                "Оставлено в черновике"
        ));

        PurchaseOrder ordered = purchaseOrderService.create(new PurchaseOrderService.CreatePurchaseOrderCommand(
                accountant.getId(),
                deliveryWarehouse.getId(),
                "Склад МБУ Просветское",
                "Заказ на ручки и файлы",
                List.of(
                        new PurchaseOrderService.CreatePurchaseOrderItemCommand(items.get(4).getId(), new BigDecimal("120")),
                        new PurchaseOrderService.CreatePurchaseOrderItemCommand(items.get(2).getId(), new BigDecimal("80"))
                )
        ));
        purchaseOrderService.changeStatus(ordered.getId(), accountant.getId(), new PurchaseOrderService.ChangePurchaseOrderStatusCommand(
                PurchaseOrderStatus.ORDERED,
                "Оформлен у поставщика"
        ));
        purchaseOrderService.changeStatus(ordered.getId(), accountant.getId(), new PurchaseOrderService.ChangePurchaseOrderStatusCommand(
                PurchaseOrderStatus.IN_TRANSIT,
                "В пути"
        ));

        PurchaseOrder completed = purchaseOrderService.create(new PurchaseOrderService.CreatePurchaseOrderCommand(
                admin.getId(),
                deliveryWarehouse.getId(),
                "Склад МБУ Просветское",
                "Поставка бумаги и блокнотов",
                List.of(
                        new PurchaseOrderService.CreatePurchaseOrderItemCommand(items.get(0).getId(), new BigDecimal("40")),
                        new PurchaseOrderService.CreatePurchaseOrderItemCommand(items.get(7).getId(), new BigDecimal("20"))
                )
        ));
        purchaseOrderService.changeStatus(completed.getId(), admin.getId(), new PurchaseOrderService.ChangePurchaseOrderStatusCommand(
                PurchaseOrderStatus.ORDERED,
                "Подтверждено"
        ));
        purchaseOrderService.changeStatus(completed.getId(), admin.getId(), new PurchaseOrderService.ChangePurchaseOrderStatusCommand(
                PurchaseOrderStatus.COMPLETED,
                "Поступление оформлено"
        ));
    }

    private SupplyItem buildItem(String name, String sku, SupplyCategory category, String unit) {
        SupplyItem item = new SupplyItem();
        item.setName(name);
        item.setSku(sku);
        item.setCategory(category);
        item.setUnit(unit);
        item.setDescription(name + " для нужд учреждения");
        return item;
    }

    private Warehouse buildWarehouse(String code, String name, String description) {
        Warehouse warehouse = new Warehouse();
        warehouse.setCode(code);
        warehouse.setName(name);
        warehouse.setDescription(description);
        warehouse.setActive(true);
        return warehouse;
    }

    private SupplyRequest createSeedRequest(SystemUser requester, Department department, RequestPriority priority, String comment, List<RequestLine> lines) {
        RequestService.CreateRequestCommand command = new RequestService.CreateRequestCommand(
                requester.getId(),
                department.getId(),
                priority,
                comment,
                lines.stream()
                        .map(line -> new RequestService.CreateRequestItemCommand(line.item().getId(), line.quantity(), line.note()))
                        .toList()
        );
        return requestService.createRequest(command);
    }

    private RequestChatMessage buildChatMessage(SupplyRequest request, SystemUser sender, String text) {
        RequestChatMessage message = new RequestChatMessage();
        message.setRequest(request);
        message.setSender(sender);
        message.setText(text);
        return message;
    }

    private record RequestLine(SupplyItem item, BigDecimal quantity, String note) {
    }
}
