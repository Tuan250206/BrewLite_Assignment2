import type { OrderHistoryEntry, OrderHistoryItem } from './orders-api';

export interface MockCheckoutItem {
  productId: string;
  name: string;
  size: string;
  topping?: string[] | null;
  quantity: number;
  unitPrice: number;
}

type StoredMockOrder = OrderHistoryEntry;

interface StoredMockPayment {
  id: string;
  orderId: string;
  idempotencyKey: string;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  method: 'WALLET' | 'CARD';
}

interface StoredMockData {
  orders: StoredMockOrder[];
  payments: StoredMockPayment[];
}

interface CreateOrderItem {
  productId: string;
  size: string;
  topping?: string[];
  qty: number;
}

const STORAGE_PREFIX = 'brewlite-order-payment-mock:';
const ORDER_STATUSES = new Set([
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'PAYMENT_FAILED',
  'CANCELLED',
]);

let checkoutSnapshot: readonly MockCheckoutItem[] = [];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ message }, status);
}

function getUserKey(headers: Headers): string | null {
  const authorization = headers.get('Authorization') ?? '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  if (!token || token !== window.sessionStorage.getItem('accessToken')) {
    return null;
  }

  const serializedUser = window.sessionStorage.getItem('currentUser');
  if (!serializedUser) return 'authenticated-user';

  try {
    const user: unknown = JSON.parse(serializedUser);
    if (isRecord(user)) {
      if (typeof user.id === 'string' && user.id.trim()) return user.id;
      if (typeof user.email === 'string' && user.email.trim()) {
        return user.email.trim().toLowerCase();
      }
    }
  } catch {
    throw new Error('Thông tin tài khoản trong phiên không hợp lệ.');
  }

  return 'authenticated-user';
}

function isOrder(value: unknown): value is StoredMockOrder {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.status !== 'string' ||
    !ORDER_STATUSES.has(value.status) ||
    typeof value.total !== 'number' ||
    !Number.isFinite(value.total) ||
    typeof value.createdAt !== 'string' ||
    !Array.isArray(value.items)
  ) {
    return false;
  }

  return value.items.every(
    (item) =>
      isRecord(item) &&
      typeof item.id === 'string' &&
      typeof item.productId === 'string' &&
      typeof item.size === 'string' &&
      typeof item.qty === 'number' &&
      typeof item.lineTotal === 'number',
  );
}

function isPayment(value: unknown): value is StoredMockPayment {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.orderId === 'string' &&
    typeof value.idempotencyKey === 'string' &&
    (value.status === 'SUCCESS' || value.status === 'FAILED') &&
    typeof value.amount === 'number' &&
    (value.method === 'WALLET' || value.method === 'CARD')
  );
}

function loadData(userKey: string): StoredMockData {
  const serialized = window.sessionStorage.getItem(
    `${STORAGE_PREFIX}${encodeURIComponent(userKey)}`,
  );
  if (!serialized) return { orders: [], payments: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error('Dữ liệu đơn hàng Mock bị lỗi định dạng.');
  }
  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.orders) ||
    !parsed.orders.every(isOrder) ||
    !Array.isArray(parsed.payments) ||
    !parsed.payments.every(isPayment)
  ) {
    throw new Error('Dữ liệu đơn hàng Mock trong phiên không hợp lệ.');
  }

  return {
    orders: parsed.orders,
    payments: parsed.payments,
  };
}

function saveData(userKey: string, data: StoredMockData): void {
  window.sessionStorage.setItem(
    `${STORAGE_PREFIX}${encodeURIComponent(userKey)}`,
    JSON.stringify(data),
  );
}

function findOrder(
  data: StoredMockData,
  orderId: string,
): StoredMockOrder | undefined {
  return data.orders.find((order) => order.id === orderId);
}

function serializeOrder(order: StoredMockOrder): Record<string, unknown> {
  return {
    id: order.id,
    status: order.status,
    total: String(order.total),
    createdAt: order.createdAt,
    orderItems: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      product: item.product ?? null,
      size: item.size,
      topping: item.topping ?? '',
      qty: item.qty,
      lineTotal: String(item.lineTotal),
    })),
  };
}

function createOrderItems(
  items: CreateOrderItem[],
): { items: OrderHistoryItem[]; total: number } {
  const orderItems = items.map((item, index) => {
    const snapshot = checkoutSnapshot.find(
      (candidate) =>
        candidate.productId === item.productId && candidate.size === item.size,
    ) ?? checkoutSnapshot[index];
    const toppings = item.topping ?? [];
    const lineTotal = (snapshot?.unitPrice ?? 0) * item.qty;

    return {
      id: crypto.randomUUID(),
      productId: item.productId,
      product: { name: snapshot?.name ?? 'Sản phẩm' },
      size: item.size,
      topping: toppings.join(', ') || null,
      qty: item.qty,
      lineTotal,
    };
  });

  return {
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

function isCreateOrderItem(value: unknown): value is CreateOrderItem {
  return (
    isRecord(value) &&
    typeof value.productId === 'string' &&
    typeof value.size === 'string' &&
    ['S', 'M', 'L'].includes(value.size) &&
    Array.isArray(value.topping ?? []) &&
    (value.topping === undefined ||
      (Array.isArray(value.topping) &&
        value.topping.every((topping) => typeof topping === 'string'))) &&
    typeof value.qty === 'number' &&
    Number.isInteger(value.qty) &&
    value.qty >= 1 &&
    value.qty <= 20
  );
}

export function setMockCheckoutSnapshot(
  items: readonly MockCheckoutItem[],
): void {
  checkoutSnapshot = items.map((item) => ({
    ...item,
    topping: item.topping ? [...item.topping] : item.topping,
  }));
}

async function readBody(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<unknown> {
  const body = init?.body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  }
  if (input instanceof Request) {
    try {
      return (await input.clone().json()) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

function serializePayment(payment: StoredMockPayment): Record<string, unknown> {
  return {
    success: payment.status === 'SUCCESS',
    orderId: payment.orderId,
    paymentId: payment.id,
    status: payment.status,
    amount: String(payment.amount),
    method: payment.method,
  };
}

export async function handleMockOrderPaymentRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const request = input instanceof Request ? input : null;
  const url = new URL(request?.url ?? String(input), window.location.origin);
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
  const headers = new Headers(request?.headers);
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value));

  let userKey: string | null;
  try {
    userKey = getUserKey(headers);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Không thể xác thực phiên Mock.',
      400,
    );
  }
  if (!userKey) return errorResponse('Unauthorized', 401);

  let data: StoredMockData;
  try {
    data = loadData(userKey);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Không thể đọc dữ liệu Mock.',
      500,
    );
  }

  if (url.pathname === '/orders' && method === 'POST') {
    const body = await readBody(input, init);
    if (
      !isRecord(body) ||
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 20 ||
      !body.items.every(isCreateOrderItem)
    ) {
      return errorResponse('Dữ liệu tạo đơn Mock không hợp lệ.', 400);
    }

    const created = createOrderItems(body.items);
    const order: StoredMockOrder = {
      id: crypto.randomUUID(),
      status: 'PENDING',
      total: created.total,
      createdAt: new Date().toISOString(),
      items: created.items,
    };
    data.orders.unshift(order);
    checkoutSnapshot = [];
    try {
      saveData(userKey, data);
    } catch {
      return errorResponse('Không thể lưu đơn Mock trong phiên trình duyệt.', 500);
    }
    return jsonResponse(serializeOrder(order), 201);
  }

  if (url.pathname === '/orders/me' && method === 'GET') {
    return jsonResponse(data.orders.map(serializeOrder));
  }

  const orderAction = url.pathname.match(
    /^\/orders\/([^/]+)\/(cancel|retry-payment)$/,
  );
  if (orderAction && method === 'PATCH') {
    const orderId = decodeURIComponent(orderAction[1]);
    const action = orderAction[2];
    const order = findOrder(data, orderId);
    if (!order) return errorResponse('Không tìm thấy đơn Mock.', 404);

    if (action === 'cancel') {
      if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
        return errorResponse('Trạng thái đơn Mock không cho phép hủy.', 409);
      }
      order.status = 'CANCELLED';
    } else {
      if (order.status !== 'PAYMENT_FAILED') {
        return errorResponse(
          'Chỉ có thể thử lại đơn Mock thanh toán thất bại.',
          409,
        );
      }
      order.status = 'PENDING';
    }

    try {
      saveData(userKey, data);
    } catch {
      return errorResponse('Không thể lưu trạng thái đơn Mock.', 500);
    }
    return jsonResponse(serializeOrder(order));
  }

  if (url.pathname === '/payments' && method === 'POST') {
    const body = await readBody(input, init);
    const idempotencyKey = headers.get('Idempotency-Key')?.trim() ?? '';
    if (
      !isRecord(body) ||
      typeof body.orderId !== 'string' ||
      (body.method !== 'WALLET' && body.method !== 'CARD') ||
      (body.simulateFail !== undefined &&
        typeof body.simulateFail !== 'boolean') ||
      !idempotencyKey
    ) {
      return errorResponse('Dữ liệu thanh toán Mock không hợp lệ.', 400);
    }

    const previousPayment = data.payments.find(
      (payment) => payment.idempotencyKey === idempotencyKey,
    );
    if (previousPayment) {
      if (previousPayment.orderId !== body.orderId) {
        return errorResponse('Idempotency-Key đã được dùng cho đơn khác.', 409);
      }
      return jsonResponse(serializePayment(previousPayment));
    }

    const order = findOrder(data, body.orderId);
    if (!order) return errorResponse('Không tìm thấy đơn Mock.', 404);
    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      return errorResponse(
        'Đơn Mock không ở trạng thái có thể thanh toán.',
        409,
      );
    }

    const payment: StoredMockPayment = {
      id: crypto.randomUUID(),
      orderId: order.id,
      idempotencyKey,
      status: body.simulateFail === true ? 'FAILED' : 'SUCCESS',
      amount: order.total,
      method: body.method,
    };
    order.status = payment.status === 'SUCCESS' ? 'PAID' : 'PAYMENT_FAILED';
    data.payments.push(payment);
    try {
      saveData(userKey, data);
    } catch {
      return errorResponse('Không thể lưu thanh toán Mock trong phiên.', 500);
    }
    return jsonResponse(serializePayment(payment));
  }

  const paymentStatusMatch = url.pathname.match(
    /^\/payments\/orders\/([^/]+)\/status$/,
  );
  if (paymentStatusMatch && method === 'GET') {
    const orderId = decodeURIComponent(paymentStatusMatch[1]);
    const order = findOrder(data, orderId);
    if (!order) return errorResponse('Không tìm thấy đơn Mock.', 404);

    const payment = [...data.payments]
      .reverse()
      .find((candidate) => candidate.orderId === orderId);
    return jsonResponse({
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: payment?.status ?? null,
      paymentId: payment?.id ?? null,
      amount: payment ? String(payment.amount) : null,
      method: payment?.method ?? null,
    });
  }

  return errorResponse('Mock Orders/Payments endpoint không được hỗ trợ.', 404);
}
