package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.Department;
import com.github.danbel.shalukhinaapi.domain.RequestPriority;
import com.github.danbel.shalukhinaapi.domain.RequestStatus;
import com.github.danbel.shalukhinaapi.domain.StockMovementType;
import com.github.danbel.shalukhinaapi.domain.SupplyCategory;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.RequestChatMessage;
import com.github.danbel.shalukhinaapi.domain.SupplyRequest;
import com.github.danbel.shalukhinaapi.domain.SupplyRequestItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.UserRole;
import com.github.danbel.shalukhinaapi.repo.DepartmentRepository;
import com.github.danbel.shalukhinaapi.repo.RequestChatMessageRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyRequestRepository;
import com.github.danbel.shalukhinaapi.repo.StockMovementRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyCategoryRepository;
import com.github.danbel.shalukhinaapi.repo.SupplyItemRepository;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import com.github.danbel.shalukhinaapi.service.RequestService;
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
    private final StockMovementRepository movementRepository;
    private final RequestService requestService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0 && userRepository.count() == 0 && itemRepository.count() == 0) {
            seedBaseData();
        }

        if (chatMessageRepository.count() == 0) {
            seedChatData();
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

        List<SupplyItem> items = itemRepository.saveAll(List.of(
                buildItem("Бумага A4", "A4-001", paper, "пачка", new BigDecimal("48"), new BigDecimal("10"), "Склад 1"),
                buildItem("Ручка шариковая синяя", "PEN-002", writing, "шт", new BigDecimal("180"), new BigDecimal("30"), "Склад 1"),
                buildItem("Карандаш HB", "PEN-003", writing, "шт", new BigDecimal("96"), new BigDecimal("20"), "Склад 1"),
                buildItem("Папка-скоросшиватель", "FIL-004", filing, "шт", new BigDecimal("64"), new BigDecimal("15"), "Склад 2"),
                buildItem("Файл прозрачный", "FIL-005", filing, "шт", new BigDecimal("240"), new BigDecimal("60"), "Склад 2"),
                buildItem("Стикеры", "OFF-006", paper, "упак", new BigDecimal("18"), new BigDecimal("5"), "Склад 1"),
                buildItem("Маркеры для доски", "PRES-007", presentation, "набор", new BigDecimal("22"), new BigDecimal("6"), "Склад 3"),
                buildItem("Блокнот А5", "NOTE-008", paper, "шт", new BigDecimal("35"), new BigDecimal("12"), "Склад 1")
        ));

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

        movementRepository.save(buildMovement(items.get(0), new BigDecimal("20"), admin, StockMovementType.RECEIPT, "Поступление №15", "Поставка от поставщика"));
        movementRepository.save(buildMovement(items.get(1), new BigDecimal("50"), accountant, StockMovementType.RECEIPT, "Поступление №16", "Пополнение шариковых ручек"));
        movementRepository.save(buildMovement(items.get(6), new BigDecimal("12"), responsible, StockMovementType.RECEIPT, "Поступление №17", "Маркерные наборы"));
        movementRepository.save(buildMovement(items.get(0), new BigDecimal("4"), responsible, StockMovementType.ADJUSTMENT, "Инвентаризация", "Корректировка по итогам сверки"));
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

    private SupplyItem buildItem(String name, String sku, SupplyCategory category, String unit, BigDecimal quantity, BigDecimal minQuantity, String location) {
        SupplyItem item = new SupplyItem();
        item.setName(name);
        item.setSku(sku);
        item.setCategory(category);
        item.setUnit(unit);
        item.setCurrentQuantity(quantity);
        item.setMinQuantity(minQuantity);
        item.setStorageLocation(location);
        item.setDescription(name + " для нужд учреждения");
        return item;
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

    private com.github.danbel.shalukhinaapi.domain.StockMovement buildMovement(
            SupplyItem item,
            BigDecimal quantity,
            SystemUser actor,
            StockMovementType type,
            String sourceDocument,
            String comment
    ) {
        com.github.danbel.shalukhinaapi.domain.StockMovement movement = new com.github.danbel.shalukhinaapi.domain.StockMovement();
        movement.setItem(item);
        movement.setQuantity(quantity);
        movement.setActor(actor);
        movement.setType(type);
        movement.setSourceDocument(sourceDocument);
        movement.setComment(comment);
        return movement;
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
