import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { orderPaymentFetch, setCheckoutMockSnapshot } from './order-payment-api';
import { fetchMyOrders, updateMyOrder } from './orders-api';

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

const sessionStorage = new TestStorage();
const token = 'mock-session-token';
const authHeaders = { Authorization: `Bearer ${token}` };
let uuidCounter = 0;

async function request(path: string, init?: RequestInit): Promise<Response> {
  return orderPaymentFetch(`http://localhost:3001${path}`, {
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

async function createOrder(): Promise<string> {
  setCheckoutMockSnapshot([
    {
      productId: '4cd315d6-db92-4d12-939c-2dff1177efbd',
      name: 'Berry Fizz',
      size: 'M',
      topping: ['Trân châu đen'],
      quantity: 2,
      unitPrice: 65000,
    },
  ]);
  const response = await request('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        {
          productId: '4cd315d6-db92-4d12-939c-2dff1177efbd',
          size: 'M',
          topping: ['Trân châu đen'],
          qty: 2,
        },
      ],
    }),
  });
  expect(response.status).toBe(201);
  const created: unknown = await response.json();
  expect(created).toMatchObject({
    status: 'PENDING',
    orderItems: [
      {
        product: { name: 'Berry Fizz' },
        topping: 'Trân châu đen',
        qty: 2,
        lineTotal: '130000',
      },
    ],
  });
  return (created as { id: string }).id;
}

describe('Mock Orders and Payments API adapter', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('accessToken', token);
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 'e2e-user', email: 'e2e@example.com' }),
    );
    vi.stubGlobal('sessionStorage', sessionStorage);
    vi.stubGlobal('window', {
      sessionStorage,
      location: { origin: 'http://localhost:3000' },
    });
    vi.stubGlobal('crypto', {
      randomUUID: () => `mock-id-${++uuidCounter}`,
    });
    uuidCounter = 0;
    vi.stubEnv('NEXT_PUBLIC_BREWLITE_ORDER_MOCK', 'true');
    setCheckoutMockSnapshot([
      {
        productId: '4cd315d6-db92-4d12-939c-2dff1177efbd',
        name: 'Berry Fizz',
        size: 'M',
        topping: ['Trân châu đen'],
        quantity: 2,
        unitPrice: 65000,
      },
    ]);
  });

  it('creates SUCCESS/FAILED payments and returns persisted backend-shaped history', async () => {
    const successOrderId = await createOrder();
    const success = await request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'payment-success-key',
      },
      body: JSON.stringify({
        orderId: successOrderId,
        method: 'WALLET',
        simulateFail: false,
      }),
    });
    expect(await success.json()).toMatchObject({
      success: true,
      orderId: successOrderId,
      status: 'SUCCESS',
      amount: '130000',
      method: 'WALLET',
    });

    const failedOrderId = await createOrder();
    const failed = await request('/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'payment-failed-key',
      },
      body: JSON.stringify({
        orderId: failedOrderId,
        method: 'CARD',
        simulateFail: true,
      }),
    });
    expect(await failed.json()).toMatchObject({
      success: false,
      orderId: failedOrderId,
      status: 'FAILED',
    });

    const history = await fetchMyOrders(token);
    expect(history.map((order) => [order.id, order.status])).toEqual([
      [failedOrderId, 'PAYMENT_FAILED'],
      [successOrderId, 'PAID'],
    ]);
    expect(history[0].items[0]).toMatchObject({
      product: { name: 'Berry Fizz' },
      lineTotal: 130000,
    });
  });

  it('supports cancellation and retry using the backend update response shape', async () => {
    const orderId = await createOrder();
    const failed = await request('/payments', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'payment-failed-retry' },
      body: JSON.stringify({
        orderId,
        method: 'CARD',
        simulateFail: true,
      }),
    });
    expect(failed.status).toBe(200);

    const retried = await updateMyOrder(token, orderId, 'retry-payment');
    expect(retried.status).toBe('PENDING');

    const cancelled = await updateMyOrder(token, orderId, 'cancel');
    expect(cancelled.status).toBe('CANCELLED');
    expect((await fetchMyOrders(token))[0].status).toBe('CANCELLED');
  });

  it('uses the real fetch when mock is disabled and leaves Auth/Products real', async () => {
    const realResponse = new Response('real api', { status: 200 });
    const realFetch = vi.fn<typeof fetch>().mockResolvedValue(realResponse);
    vi.stubGlobal('fetch', realFetch);

    const mockOrderResponse = await createOrder();
    expect(mockOrderResponse).toBeTruthy();
    expect(realFetch).not.toHaveBeenCalled();

    await orderPaymentFetch('http://localhost:3001/auth/login', {
      method: 'POST',
    });
    await orderPaymentFetch('http://localhost:3001/products');
    expect(realFetch).toHaveBeenCalledTimes(2);

    vi.stubEnv('NEXT_PUBLIC_BREWLITE_ORDER_MOCK', 'false');
    const realOrderResponse = await orderPaymentFetch(
      'http://localhost:3001/orders',
      { method: 'POST' },
    );
    expect(realOrderResponse).toBe(realResponse);
    expect(realFetch).toHaveBeenCalledTimes(3);
  });
});
