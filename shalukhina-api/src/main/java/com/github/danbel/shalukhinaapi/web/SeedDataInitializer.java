package com.github.danbel.shalukhinaapi.web;

import com.github.danbel.shalukhinaapi.domain.Department;
import com.github.danbel.shalukhinaapi.domain.RequestPriority;
import com.github.danbel.shalukhinaapi.domain.SupplyCategory;
import com.github.danbel.shalukhinaapi.domain.SupplyItem;
import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.UserRole;
import com.github.danbel.shalukhinaapi.repo.DepartmentRepository;
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
    private final RequestService requestService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (departmentRepository.count() > 0 || userRepository.count() > 0 || itemRepository.count() > 0) {
            return;
        }

        Department adminDepartment = new Department();
        adminDepartment.setCode("ADMIN");
        adminDepartment.setName("Администрация");
        departmentRepository.save(adminDepartment);

        Department servicesDepartment = new Department();
        servicesDepartment.setCode("SERV");
        servicesDepartment.setName("Служебные подразделения");
        departmentRepository.save(servicesDepartment);

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

        SystemUser responsible = new SystemUser();
        responsible.setFullName("Ольга Сидорова");
        responsible.setEmail("olga.sidorova@prosvet.ru");
        responsible.setUsername("osidorova");
        responsible.setPasswordHash(passwordEncoder.encode("responsible123"));
        responsible.setRole(UserRole.RESPONSIBLE);
        responsible.setDepartment(adminDepartment);
        responsible.setPosition("Ответственный за заявки и склад");
        userRepository.save(responsible);

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

        List<SupplyItem> items = itemRepository.saveAll(List.of(
                buildItem("Бумага A4", "A4-001", paper, "пачка", new BigDecimal("48"), new BigDecimal("10"), "Склад 1"),
                buildItem("Ручка шариковая синяя", "PEN-002", writing, "шт", new BigDecimal("180"), new BigDecimal("30"), "Склад 1"),
                buildItem("Карандаш HB", "PEN-003", writing, "шт", new BigDecimal("96"), new BigDecimal("20"), "Склад 1"),
                buildItem("Папка-скоросшиватель", "FIL-004", filing, "шт", new BigDecimal("64"), new BigDecimal("15"), "Склад 2"),
                buildItem("Файл прозрачный", "FIL-005", filing, "шт", new BigDecimal("240"), new BigDecimal("60"), "Склад 2"),
                buildItem("Стикеры", "OFF-006", paper, "упак", new BigDecimal("18"), new BigDecimal("5"), "Склад 1")
        ));

        requestService.createRequest(new RequestService.CreateRequestCommand(
                employee.getId(),
                servicesDepartment.getId(),
                RequestPriority.NORMAL,
                "Запрос на текущую неделю",
                List.of(
                        new RequestService.CreateRequestItemCommand(items.get(0).getId(), new BigDecimal("2"), "Для принтера"),
                        new RequestService.CreateRequestItemCommand(items.get(1).getId(), new BigDecimal("10"), "Для сотрудников")
                )
        ));
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
}
