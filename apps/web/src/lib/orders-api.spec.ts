import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchMyOrders,
  updateMyOrder,
  getApiErrorMessage,
  OrdersApiError,
} from './orders-api';

// Backend (Prisma) trả quan hệ `orderItems` và serialize Decimal thành string.
// Spec này khoá lại hợp đồng đó để tránh lệch FE/BE như giai đoạn làm song song.
const backendOrder = {
  id: 'order-1',
  status: 'PAID',
  total: '115000.5',
  createdAt: '2026-11-12T03:00:00.000Z',
  orderItems: [
    {
      id: 'item-1',
      productId: 'prod-1',
      product: { name: 'Brew Latte' },
      size: 'M',
      topping: 'Trân châu đen',
      qty: 2,
      lineTotal: '115000.5',
    },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('orders-api', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fetchMyOrders', () => {
    it('parse orderItems và chuyển Decimal string thành number', async () => {
      fetchMock.mockResolvedValue(jsonResponse([backendOrder]));

      const orders = await fetchMyOrders('token-abc');

      expect(orders).toHaveLength(1);
      expect(orders[0].total).toBe(115000.5);
      expect(orders[0].items).toHaveLength(1);
      expect(orders[0].items[0]).toMatchObject({
        id: 'item-1',
        productId: 'prod-1',
        product: { name: 'Brew Latte' },
        size: 'M',
        topping: 'Trân châu đen',
        qty: 2,
        lineTotal: 115000.5,
      });

      const [calledUrl, init] = fetchMock.mock.calls[0];
      expect(calledUrl).toContain('/orders/me');
      expect((init?.headers as Record<string, string>).Authorization).toBe(
        'Bearer token-abc',
      );
    });

    it('ném invalid-response khi backend trả sai tên quan hệ (items thay vì orderItems)', async () => {
      const { orderItems, ...rest } = backendOrder;
      const wrongShape = { ...rest, items: orderItems };
      fetchMock.mockResolvedValue(jsonResponse([wrongShape]));

      await expect(fetchMyOrders('token-abc')).rejects.toMatchObject({
        name: 'OrdersApiError',
        kind: 'invalid-response',
      });
    });

    it('ném unauthorized khi gặp 401', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

      const error = await fetchMyOrders('token-abc').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(OrdersApiError);
      expect((error as OrdersApiError).kind).toBe('unauthorized');
    });
  });

  describe('updateMyOrder', () => {
    it('gửi PATCH tới /orders/:id/retry-payment và parse kết quả', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ ...backendOrder, status: 'PAID' }),
      );

      const order = await updateMyOrder('token-abc', 'order-1', 'retry-payment');

      expect(order.status).toBe('PAID');
      const [calledUrl, init] = fetchMock.mock.calls[0];
      expect(calledUrl).toContain('/orders/order-1/retry-payment');
      expect(init?.method).toBe('PATCH');
    });

    it('trích message lỗi của NestJS khi request thất bại', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({ message: 'Đơn hàng không ở trạng thái cho phép hủy' }, 409),
      );

      const error = await updateMyOrder('token-abc', 'order-1', 'cancel').catch(
        (e: unknown) => e,
      );
      expect((error as OrdersApiError).kind).toBe('request');
      expect((error as OrdersApiError).message).toBe(
        'Đơn hàng không ở trạng thái cho phép hủy',
      );
    });
  });

  describe('getApiErrorMessage', () => {
    it('nhận message dạng string', () => {
      expect(getApiErrorMessage({ message: 'Lỗi rồi' }, 'fallback')).toBe(
        'Lỗi rồi',
      );
    });

    it('gộp message dạng mảng (class-validator) và bỏ phần tử không phải string', () => {
      expect(
        getApiErrorMessage({ message: ['field a sai', 123, 'field b sai'] }, 'fallback'),
      ).toBe('field a sai, field b sai');
    });

    it('trả fallback khi không có message hợp lệ', () => {
      expect(getApiErrorMessage({}, 'fallback')).toBe('fallback');
      expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
      expect(getApiErrorMessage({ message: '' }, 'fallback')).toBe('fallback');
    });
  });
});
