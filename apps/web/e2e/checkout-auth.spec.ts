import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';

const password = 'BrewLite-E2E-Password-2026';

function uniqueEmail(): string {
  return `e2e-${randomUUID()}@example.com`;
}

async function openAuthModal(page: Page): Promise<Locator> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('heading', { name: 'Đăng nhập BrewLite' }),
  ).toBeVisible();
  return dialog;
}

async function registerAccount(
  page: Page,
  email: string,
): Promise<void> {
  const dialog = await openAuthModal(page);
  await dialog.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await dialog.getByLabel('Nhập lại mật khẩu').fill(password);
  await dialog.locator('form').getByRole('button', { name: 'Tạo tài khoản' }).click();
  await expect(
    dialog.getByRole('status').getByText('Đăng ký thành công. Vui lòng đăng nhập.'),
  ).toBeVisible();
}

async function loginRegisteredAccount(page: Page, email: string): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Đăng nhập BrewLite' });
  await dialog.getByLabel('Email').fill(email);
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await dialog.locator('form').getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole('button', { name: new RegExp(email.split('@')[0]) }),
  ).toBeVisible();
}

async function registerAndLogin(page: Page): Promise<string> {
  const email = uniqueEmail();
  await registerAccount(page, email);
  await loginRegisteredAccount(page, email);
  return email;
}

async function openOrderHistory(page: Page, email: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(email.split('@')[0]) }).click();
  await page.getByRole('link', { name: 'Đơn hàng của tôi' }).click();
  await page.waitForURL('**/orders');
  await expect(page.getByRole('heading', { name: 'Lịch sử đơn hàng' })).toBeVisible();
}

async function createPendingOrder(page: Page): Promise<void> {
  const addProduct = page.getByRole('button', { name: /^Thêm .+ vào giỏ$/ }).first();
  await expect(addProduct).toBeEnabled();
  await addProduct.click();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Xác nhận thanh toán' }),
  ).toBeVisible();
}

async function startPayment(page: Page, result: 'SUCCESS' | 'FAILED'): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Xác nhận thanh toán' });
  await dialog.getByRole('button', { name: /Kịch bản mô phỏng A/ }).click();
  await dialog.getByRole('button', { name: new RegExp(result) }).click();
  await dialog.getByRole('button', { name: 'Thanh toán ngay' }).click();
}

async function openOrderHistoryBehindPendingModal(
  page: Page,
  email: string,
): Promise<void> {
  await page
    .getByRole('button', { name: new RegExp(email.split('@')[0]) })
    .evaluate((button) => (button as HTMLButtonElement).click());
  const historyLink = page.getByRole('link', { name: 'Đơn hàng của tôi' });
  await historyLink.evaluate((link) => (link as HTMLAnchorElement).click());
  await page.waitForURL('**/orders');
  await expect(page.getByRole('heading', { name: 'Lịch sử đơn hàng' })).toBeVisible();
}

test('đăng ký tài khoản qua Auth API thật', async ({ page }) => {
  const dialog = await openAuthModal(page);
  await dialog.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await dialog.getByLabel('Email').fill(uniqueEmail());
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await dialog.getByLabel('Nhập lại mật khẩu').fill(password);
  await dialog.locator('form').getByRole('button', { name: 'Tạo tài khoản' }).click();

  await expect(
    dialog.getByRole('status').getByText('Đăng ký thành công. Vui lòng đăng nhập.'),
  ).toBeVisible();
});

test('đăng nhập thành công bằng tài khoản vừa đăng ký', async ({ page }) => {
  const email = await registerAndLogin(page);
  await expect(
    page.getByRole('button', { name: new RegExp(email.split('@')[0]) }),
  ).toBeVisible();
});

test('hiển thị lỗi khi đăng nhập sai', async ({ page }) => {
  const dialog = await openAuthModal(page);
  await dialog.getByLabel('Email').fill(uniqueEmail());
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill('Wrong-password-123');
  await dialog.locator('form').getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText(
    'Invalid email or password',
  );
});

test('duy trì phiên đăng nhập thật sau khi tải lại trang', async ({ page }) => {
  const email = await registerAndLogin(page);
  await page.reload();

  await expect(
    page.getByRole('button', { name: new RegExp(email.split('@')[0]) }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('accessToken'))).toBeTruthy();
});

test('Mock Payment SUCCESS hiện xác nhận PAID và lịch sử không có nút hủy', async ({
  page,
}) => {
  const email = await registerAndLogin(page);
  await createPendingOrder(page);
  await startPayment(page, 'SUCCESS');
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thành công' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Tiếp tục đặt món' }).click();
  await openOrderHistory(page, email);
  await expect(page.getByText('Đã thanh toán')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy đơn' })).toHaveCount(0);
});

test('PAYMENT_FAILED có thể hủy và trạng thái CANCELLED được lưu vào lịch sử', async ({
  page,
}) => {
  const email = await registerAndLogin(page);
  await createPendingOrder(page);
  await startPayment(page, 'FAILED');
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thất bại' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Hủy đơn' }).click();
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thất bại' }),
  ).toBeHidden();
  await openOrderHistory(page, email);
  await expect(page.getByText('Đã hủy')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy đơn' })).toHaveCount(0);
});

test('PAYMENT_FAILED có thể thử thanh toán lại thành công', async ({ page }) => {
  await registerAndLogin(page);
  await createPendingOrder(page);
  await startPayment(page, 'FAILED');
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thất bại' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Xác nhận thanh toán' }),
  ).toBeVisible();
  await startPayment(page, 'SUCCESS');
  await expect(
    page.getByRole('heading', { name: 'Thanh toán thành công' }),
  ).toBeVisible();
});

test('PENDING trong lịch sử không có nút hủy thủ công', async ({ page }) => {
  const email = await registerAndLogin(page);
  await createPendingOrder(page);
  await openOrderHistoryBehindPendingModal(page, email);

  await expect(page.getByText('Chờ thanh toán')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hủy đơn' })).toHaveCount(0);
});

test('Quay lại từ Checkout PENDING xác nhận CANCELLED', async ({ page }) => {
  const email = await registerAndLogin(page);
  await createPendingOrder(page);
  await page
    .getByRole('dialog', { name: 'Xác nhận thanh toán' })
    .getByRole('button', { name: 'Quay lại' })
    .click();

  await expect(
    page.getByRole('status').filter({ hasText: 'Backend đã xác nhận hủy đơn' }),
  ).toBeVisible();
  await openOrderHistory(page, email);
  await expect(page.getByText('Đã hủy')).toBeVisible();
});
