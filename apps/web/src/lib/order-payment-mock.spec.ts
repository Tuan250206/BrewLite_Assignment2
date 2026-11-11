import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  handleMockOrderPaymentRequest,
  setMockCheckoutSnapshot,
} from './order-payment-mock';
import { orderPaymentFetch } from './order-payment-api';

class TestStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const userStorage = new TestStorage();
const sessionStorage = new TestStorage();
const authHeaders = {
  Authorization: 'Bearer real-auth-session-token',
};

async function request(path: string, init?: RequestInit): Promise<Response> {
  return handleMockOrderPaymentRequest(`http://localhost:3001${path}`, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : Array.isArray(init?.headers)
          ? Object.fromEntries(init.headers)
          : init?.headers),
    },
  });
}

describe('Mock Orders and Payments API', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    userStorage.clear();
    sessionStorage.clear();
    userStorage.setItem('accessToken', authHeaders.Authorization.slice(7));
    userStorage.setItem('currentUser', JSON.stringify({ id: 'test-user' }));
    vi.stubGlobal('localStorage', userStorage);
    vi.stubGlobal('sessionStorage', sessionStorage);
    vi.stubGlobal('window', {
      localStorage: userStorage,
      sessionStorage,
      location: { origin: 'http://localhost:3000' },
    });
    vi.stubGlobal('crypto', { randomUUID: () => 'mock-generated-id' });
  });

  it('creates an order, persists failure/retry/success state, and returns history', async () => {
    setMockCheckoutSnapshot([
      {
        productId: 'product-1',
        name: 'Latte',
        size: 'M',
        topping: ['Pearl'],
        quantity: 2,
        unitPrice: 42000,
      },
    ]);

    const createResponse = await request('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            productId: 'product-1',
            size: 'M',
            topping: ['Pearl'],
            qty: 2,
          },
        ],
      }),
    });
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string };

    const failedPayment = await request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'payment-failed-1',
      },
      body: JSON.stringify({
        orderId: created.id,
        method: 'WALLET',
        simulateFail: true,
      }),
    });
    expect(await failedPayment.json()).toEqual({
      success: true,
      status: 'PAYMENT_FAILED',
    });

    const historyAfterFailure = await request('/orders/me');
    const [failedOrder] = (await historyAfterFailure.json()) as Array<{
      status: string;
      total: number;
      items: Array<{ product: { name: string }; lineTotal: number }>;
    }>;
    expect(failedOrder).toMatchObject({
      status: 'PAYMENT_FAILED',
      total: 84000,
      items: [{ product: { name: 'Latte' }, lineTotal: 84000 }],
    });

    const retry = await request(`/orders/${created.id}/retry-payment`, {
      method: 'PATCH',
    });
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({ status: 'PENDING' });

    const successfulPayment = await request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'payment-success-1',
      },
      body: JSON.stringify({
        orderId: created.id,
        method: 'CARD',
        simulateFail: false,
      }),
    });
    expect(await successfulPayment.json()).toMatchObject({
      success: true,
      status: 'PENDING',
      gateway: { name: 'MOCK', paymentUrl: 'about:blank' },
      mockEmail: null,
    });

    const rejectCancellationAfterSuccess = await request(
      `/orders/${created.id}/cancel`,
      { method: 'PATCH' },
    );
    expect(rejectCancellationAfterSuccess.status).toBe(409);

    const paymentStatus = await request(
      `/payments/orders/${created.id}/status`,
    );
    expect(await paymentStatus.json()).toEqual({ paymentStatus: 'PAID' });

    const historyAfterSuccess = await request('/orders/me');
    expect(await historyAfterSuccess.json()).toMatchObject([
      { id: created.id, status: 'PAID', total: 84000 },
    ]);
  });

  it('cancels a pending order and rejects unauthenticated requests', async () => {
    setMockCheckoutSnapshot([
      {
        productId: 'product-2',
        name: 'Tea',
        size: 'S',
        quantity: 1,
        unitPrice: 25000,
      },
    ]);
    const createResponse = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: 'product-2', size: 'S', qty: 1 }],
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const cancel = await request(`/orders/${created.id}/cancel`, {
      method: 'PATCH',
    });
    expect(await cancel.json()).toMatchObject({ status: 'CANCELLED' });

    const unauthenticated = await handleMockOrderPaymentRequest(
      'http://localhost:3001/orders/me',
    );
    expect(unauthenticated.status).toBe(401);
  });

  it('keeps cancelled orders in history and rejects further cancellation or retry', async () => {
    setMockCheckoutSnapshot([
      {
        productId: 'product-cancelled',
        name: 'Americano',
        size: 'M',
        quantity: 1,
        unitPrice: 30000,
      },
    ]);
    const createResponse = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: 'product-cancelled', size: 'M', qty: 1 }],
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    const cancel = await request(`/orders/${created.id}/cancel`, {
      method: 'PATCH',
    });
    expect(await cancel.json()).toMatchObject({ status: 'CANCELLED' });

    const cancelAgain = await request(`/orders/${created.id}/cancel`, {
      method: 'PATCH',
    });
    expect(cancelAgain.status).toBe(409);

    const retryCancelled = await request(
      `/orders/${created.id}/retry-payment`,
      { method: 'PATCH' },
    );
    expect(retryCancelled.status).toBe(409);

    const history = await request('/orders/me');
    expect(await history.json()).toMatchObject([
      { id: created.id, status: 'CANCELLED' },
    ]);
  });

  it('cancels an order after a failed payment', async () => {
    setMockCheckoutSnapshot([
      {
        productId: 'product-3',
        name: 'Mocha',
        size: 'L',
        quantity: 1,
        unitPrice: 52000,
      },
    ]);
    const createResponse = await request('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: 'product-3', size: 'L', qty: 1 }],
      }),
    });
    const created = (await createResponse.json()) as { id: string };

    await request('/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'payment-failed-2' },
      body: JSON.stringify({
        orderId: created.id,
        method: 'WALLET',
        simulateFail: true,
      }),
    });
    const cancel = await request(`/orders/${created.id}/cancel`, {
      method: 'PATCH',
    });
    expect(await cancel.json()).toMatchObject({ status: 'CANCELLED' });
  });

  it('uses the mock only when its explicit environment flag is enabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_BREWLITE_ORDER_MOCK', 'true');
    const mockResponse = await orderPaymentFetch(
      'http://localhost:3001/orders/me',
      { headers: authHeaders },
    );
    expect(mockResponse.status).toBe(200);
    expect(await mockResponse.json()).toEqual([]);

    vi.stubEnv('NEXT_PUBLIC_BREWLITE_ORDER_MOCK', 'false');
    const realResponse = new Response('real api', { status: 200 });
    const realFetch = vi.fn().mockResolvedValue(realResponse);
    vi.stubGlobal('fetch', realFetch);
    const response = await orderPaymentFetch(
      'http://localhost:3001/orders/me',
    );
    expect(response).toBe(realResponse);
    expect(realFetch).toHaveBeenCalledOnce();
  });
});
