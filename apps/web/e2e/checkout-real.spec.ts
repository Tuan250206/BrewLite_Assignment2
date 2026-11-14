import { randomUUID } from 'node:crypto';
import { expect, test, type Page, type Response } from '@playwright/test';

const apiOrigin = 'http://localhost:3001';
const password = 'BrewLite-E2E-Password-2026';

function uniqueEmail(): string {
  return `e2e-real-${randomUUID()}@example.com`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function waitForApiResponse(
  page: Page,
  method: string,
  pathname: string,
): Promise<Response> {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.origin === apiOrigin &&
      url.pathname === pathname &&
      response.request().method() === method
    );
  });
}

test('đặt món, thanh toán SUCCESS qua API thật và xem lịch sử PAID', async ({
  page,
}) => {
  const email = uniqueEmail();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  const authDialog = page.getByRole('dialog');
  await expect(
    authDialog.getByRole('heading', { name: 'Đăng nhập BrewLite' }),
  ).toBeVisible();
  await authDialog.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await authDialog.getByLabel('Email').fill(email);
  await authDialog.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await authDialog.getByLabel('Nhập lại mật khẩu').fill(password);

  const registerResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/auth/register',
  );
  await authDialog
    .locator('form')
    .getByRole('button', { name: 'Tạo tài khoản' })
    .click();
  const registerResponse = await registerResponsePromise;
  expect(registerResponse.ok()).toBe(true);
  await expect(
    authDialog
      .getByRole('status')
      .getByText('Đăng ký thành công. Vui lòng đăng nhập.'),
  ).toBeVisible();

  await authDialog.getByLabel('Email').fill(email);
  await authDialog.getByLabel('Mật khẩu', { exact: true }).fill(password);
  const loginResponsePromise = waitForApiResponse(page, 'POST', '/auth/login');
  await authDialog
    .locator('form')
    .getByRole('button', { name: 'Đăng nhập' })
    .click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBe(true);
  await expect(authDialog).toBeHidden();
  await expect(
    page.getByRole('button', { name: new RegExp(email.split('@')[0]) }),
  ).toBeVisible();

  const inStockProduct = page
    .locator('article')
    .filter({ has: page.getByText(/^Còn \d+$/) })
    .first();
  await expect(inStockProduct).toBeVisible();
  const addProductButton = inStockProduct.getByRole('button', {
    name: /^Thêm .+ vào giỏ$/,
  });
  await expect(addProductButton).toBeEnabled();
  await addProductButton.click();

  const orderResponsePromise = waitForApiResponse(page, 'POST', '/orders');
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  const orderResponse = await orderResponsePromise;
  expect(orderResponse.ok()).toBe(true);

  const orderBody: unknown = await orderResponse.json();
  expect(isRecord(orderBody)).toBe(true);
  if (!isRecord(orderBody) || typeof orderBody.id !== 'string') {
    throw new Error('Orders API did not return an order ID.');
  }
  const orderId = orderBody.id;
  expect(orderBody.status).toBe('PENDING');
  await expect(
    page.getByRole('dialog', { name: 'Xác nhận thanh toán' }),
  ).toBeVisible();

  const paymentDialog = page.getByRole('dialog', {
    name: 'Xác nhận thanh toán',
  });
  await paymentDialog.getByRole('button', { name: /Ví BrewLite/ }).click();

  const paymentResponsePromise = waitForApiResponse(
    page,
    'POST',
    '/payments',
  );
  const statusResponsePromise = waitForApiResponse(
    page,
    'GET',
    `/payments/orders/${orderId}/status`,
  );
  await paymentDialog.getByRole('button', { name: 'Thanh toán ngay' }).click();

  const paymentResponse = await paymentResponsePromise;
  expect(paymentResponse.ok()).toBe(true);
  const paymentBody: unknown = await paymentResponse.json();
  expect(isRecord(paymentBody)).toBe(true);
  if (!isRecord(paymentBody)) {
    throw new Error('Payments API returned an invalid response.');
  }
  expect(paymentBody.status).toBe('SUCCESS');
  expect(paymentBody.success).toBe(true);
  expect(paymentBody.orderId).toBe(orderId);
  expect(typeof paymentBody.paymentId).toBe('string');

  const statusResponse = await statusResponsePromise;
  expect(statusResponse.ok()).toBe(true);
  const statusBody: unknown = await statusResponse.json();
  expect(isRecord(statusBody)).toBe(true);
  if (!isRecord(statusBody)) {
    throw new Error('Payment status API returned an invalid response.');
  }
  expect(statusBody.orderStatus).toBe('PAID');
  expect(statusBody.paymentStatus).toBe('SUCCESS');

  await expect(
    page.getByRole('heading', { name: 'Thanh toán thành công' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp tục đặt món' }).click();
  await page
    .getByRole('button', { name: new RegExp(email.split('@')[0]) })
    .click();

  const historyResponsePromise = waitForApiResponse(
    page,
    'GET',
    '/orders/me',
  );
  await page.getByRole('link', { name: 'Đơn hàng của tôi' }).click();
  await page.waitForURL('**/orders');

  const historyResponse = await historyResponsePromise;
  expect(historyResponse.ok()).toBe(true);
  const historyBody: unknown = await historyResponse.json();
  expect(Array.isArray(historyBody)).toBe(true);
  if (!Array.isArray(historyBody)) {
    throw new Error('Orders history API returned an invalid response.');
  }
  const historyOrder = historyBody.find(
    (entry: unknown) => isRecord(entry) && entry.id === orderId,
  );
  expect(isRecord(historyOrder)).toBe(true);
  if (!isRecord(historyOrder)) {
    throw new Error('Created order was not found in order history.');
  }
  expect(historyOrder.status).toBe('PAID');

  const orderCard = page
    .locator('article')
    .filter({ hasText: `Đơn hàng #${orderId.slice(0, 8)}` });
  await expect(orderCard).toContainText('Đã thanh toán');
});
