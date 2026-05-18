const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOTS_DIR = path.resolve(__dirname, '..', 'artifacts', 'screenshots');

function shotPath(fileName) {
  return path.join(SHOTS_DIR, fileName);
}

async function saveShot(page, fileName) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotPath(fileName), fullPage: true });
}

async function loginAs(page, username, password) {
  await page.goto('/');
  await page.getByLabel('Логин').fill(username);
  await page.getByRole('textbox', { name: 'Пароль' }).fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page.getByText('МБУ «Просветское»')).toBeVisible({ timeout: 20_000 });
  await page.waitForLoadState('networkidle');
}

async function openSection(page, sectionName) {
  await page.getByRole('button', { name: sectionName }).first().click();
  await page.waitForLoadState('networkidle');
}

test.beforeAll(() => {
  fs.rmSync(SHOTS_DIR, { recursive: true, force: true });
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
});

test('capture all key screens for all roles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Вход для сотрудников школы')).toBeVisible();
  await saveShot(page, '01-login.png');

  await loginAs(page, 'ipetrov', 'employee123');
  await saveShot(page, '02-employee-dashboard.png');

  await openSection(page, 'Заявки');
  await saveShot(page, '03-employee-requests.png');

  await page.getByRole('button', { name: 'Создать заявку' }).first().click();
  await page.waitForURL(/\/requests\/new$/);
  await saveShot(page, '04-employee-request-create.png');

  await page.goto('/');
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByText('Вход для сотрудников школы')).toBeVisible();

  await loginAs(page, 'osidorova', 'responsible123');
  await saveShot(page, '05-responsible-dashboard.png');

  await openSection(page, 'Заявки');
  await expect(page.getByRole('heading', { name: 'Новые' })).toBeVisible();
  await saveShot(page, '06-responsible-requests-kanban.png');

  await openSection(page, 'Склад');
  await expect(page.getByRole('heading', { name: 'Закупки' })).toBeVisible();
  await saveShot(page, '07-responsible-inventory-and-purchases.png');

  await page.goto('/');
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page.getByText('Вход для сотрудников школы')).toBeVisible();

  await loginAs(page, 'admin', 'admin123');
  await saveShot(page, '08-admin-dashboard.png');

  await openSection(page, 'Заявки');
  await saveShot(page, '09-admin-requests-kanban.png');

  await openSection(page, 'Отчеты');
  await expect(page.getByText('Отчеты в Excel')).toBeVisible();
  await saveShot(page, '10-admin-reports.png');

  await openSection(page, 'Сотрудники');
  await expect(page.getByText('Сотрудники и товары')).toBeVisible();
  await saveShot(page, '11-admin-directory.png');
});
