import type { OrderHistoryEntry, OrderHistoryItem } from './orders-api';

export interface MockCheckoutItem {
  productId: string;
  name: string;
  size: string;
  topping?: string[] | null;
  quantity: number;
  unitPrice: number;
}

interface StoredMockOrders {
  orders: OrderHistoryEntry[];
  idempotencyKeys: Record<string, { orderId: string; status: OrderHistoryEntry['status'] }>;
}

interface CreateOrderItem {
  productId: string;
  size: string;
  topping?: string[] | string;
  qty: number;
}

const STORAGE_KEY_PREFIX = 'brewlite-order-payment-mock:';
const ORDER_STATUSES: ReadonlySet<string> = new Set([
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'PAYMENT_FAILED',
  'CANCELLED',
]);
const SVG_MOCK_QR = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 224 224"><rect width="224" height="224" fill="#f7f2eb"/><rect x="14" y="14" width="196" height="196" rx="12" fill="#fff" stroke="#d6d3d1"/><text x="112" y="101" text-anchor="middle" font-family="Arial,sans-serif" font-size="21" font-weight="700" fill="#1b120d">MOCK</text><text x="112" y="128" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#57534e">NO REAL PAYMENT</text></svg>',
)}`;

let checkoutSnapshot: readonly MockCheckoutItem[] | null = null;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ message }, status);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOrderStatus(value: unknown): value is OrderHistoryEntry['status'] {
  return typeof value === 'string' && ORDER_STATUSES.has(value);
}

function isStoredOrder(value: unknown): value is OrderHistoryEntry {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isOrderStatus(value.status) ||
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
      (typeof item.topping === 'string' || item.topping === null) &&
      typeof item.qty === 'number' &&
      Number.isFinite(item.qty) &&
      typeof item.lineTotal === 'number' &&
      Number.isFinite(item.lineTotal) &&
      (item.product === null ||
        (isRecord(item.product) && typeof item.product.name === 'string')),
  );
}

function getAuthenticatedUserKey(headers: Headers): string | null {
  const authorization = headers.get('Authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  if (
    !bearerToken ||
    bearerToken !== window.localStorage.getItem('accessToken')
  ) {
    return null;
  }

  const currentUser = window.localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const parsed: unknown = JSON.parse(currentUser);
      if (isRecord(parsed)) {
        if (typeof parsed.id === 'string' && parsed.id.trim()) {
          return parsed.id;
        }
        if (typeof parsed.email === 'string' && parsed.email.trim()) {
          return parsed.email.trim().toLowerCase();
        }
      }
    } catch {
      throw new Error('Thông tin tài khoản lưu trong trình duyệt không hợp lệ.');
    }
  }

  return 'authenticated-user';
}

function loadStore(userKey: string): StoredMockOrders {
  const serialized = window.sessionStorage.getItem(
    `${STORAGE_KEY_PREFIX}${encodeURIComponent(userKey)}`,
  );
  if (!serialized) return { orders: [], idempotencyKeys: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error('Dữ liệu Mock Orders trong phiên bị lỗi định dạng.');
  }
  if (
    !isRecord(parsed) ||
    !Array.isArray(parsed.orders) ||
    !parsed.orders.every(isStoredOrder) ||
    !isRecord(parsed.idempotencyKeys) ||
    !Object.values(parsed.idempotencyKeys).every(
      (value) =>
        isRecord(value) &&
        typeof value.orderId === 'string' &&
        isOrderStatus(value.status),
    )
  ) {
    throw new Error('Dữ liệu Mock Orders trong phiên không hợp lệ.');
  }

  return {
    orders: parsed.orders,
    idempotencyKeys: parsed.idempotencyKeys as StoredMockOrders['idempotencyKeys'],
  };
}

function saveStore(userKey: string, store: StoredMockOrders): void {
  window.sessionStorage.setItem(
    `${STORAGE_KEY_PREFIX}${encodeURIComponent(userKey)}`,
    JSON.stringify(store),
  );
}

function orderPath(pathname: string): { orderId: string; action: string } | null {
  const match = pathname.match(/^\/orders\/([^/]+)\/(cancel|retry-payment)$/);
  if (!match) return null;
  return { orderId: decodeURIComponent(match[1]), action: match[2] };
}

function findOrder(store: StoredMockOrders, orderId: string): OrderHistoryEntry | null {
  return store.orders.find((order) => order.id === orderId) ?? null;
}

function hasMockSuccess(store: StoredMockOrders, orderId: string): boolean {
  return Object.values(store.idempotencyKeys).some(
    (payment) => payment.orderId === orderId && payment.status === 'PAID',
  );
}

async function readJsonBody(
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

function createOrderItems(
  requestItems: CreateOrderItem[],
): { items: OrderHistoryItem[]; total: number } {
  const items = requestItems.map((item, index) => {
    const snapshot = checkoutSnapshot?.[index];
    const name =
      snapshot?.productId === item.productId && snapshot.size === item.size
        ? snapshot.name
        : 'Sản phẩm';
    const unitPrice =
      snapshot?.productId === item.productId && snapshot.size === item.size
        ? snapshot.unitPrice
        : 0;
    const toppings = Array.isArray(item.topping)
      ? item.topping.join(', ')
      : typeof item.topping === 'string'
        ? item.topping
        : '';

    return {
      id: crypto.randomUUID(),
      productId: item.productId,
      product: { name },
      size: item.size,
      topping: toppings || null,
      qty: item.qty,
      lineTotal: unitPrice * item.qty,
    };
  });

  return {
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

function createMockPaymentSession() {
  return {
    name: 'MOCK',
    transactionId: `mock-${crypto.randomUUID()}`,
    paymentUrl: 'about:blank',
    qrCodeDataUrl: SVG_MOCK_QR,
  };
}

export function setMockCheckoutSnapshot(items: readonly MockCheckoutItem[]): void {
  checkoutSnapshot = items.map((item) => ({
    ...item,
    topping: item.topping ? [...item.topping] : item.topping,
  }));
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
    userKey = getAuthenticatedUserKey(headers);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Không thể xác thực phiên Mock.',
      400,
    );
  }
  if (!userKey) return errorResponse('Unauthorized', 401);

  let store: StoredMockOrders;
  try {
    store = loadStore(userKey);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Không thể đọc dữ liệu Mock.',
      500,
    );
  }

  if (url.pathname === '/orders/me' && method === 'GET') {
    return jsonResponse(store.orders);
  }

  if (url.pathname === '/orders' && method === 'POST') {
    const body = await readJsonBody(input, init);
    if (
      !isRecord(body) ||
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      !body.items.every(
        (item): item is CreateOrderItem =>
          isRecord(item) &&
          typeof item.productId === 'string' &&
          typeof item.size === 'string' &&
          typeof item.qty === 'number' &&
          Number.isInteger(item.qty) &&
          item.qty > 0 &&
          (item.topping === undefined ||
            typeof item.topping === 'string' ||
            (Array.isArray(item.topping) &&
              item.topping.every((topping) => typeof topping === 'string'))),
      )
    ) {
      return errorResponse('Dữ liệu tạo đơn Mock không hợp lệ.', 400);
    }

    const { items, total } = createOrderItems(body.items);
    const order: OrderHistoryEntry = {
      id: crypto.randomUUID(),
      status: 'PENDING',
      total,
      createdAt: new Date().toISOString(),
      items,
    };
    store.orders.unshift(order);
    checkoutSnapshot = null;
    try {
      saveStore(userKey, store);
    } catch {
      return errorResponse('Không thể lưu đơn Mock trong phiên trình duyệt.', 500);
    }
    return jsonResponse({ id: order.id }, 201);
  }

  if (url.pathname === '/payments' && method === 'POST') {
    const body = await readJsonBody(input, init);
    if (
      !isRecord(body) ||
      typeof body.orderId !== 'string' ||
      (body.method !== 'WALLET' && body.method !== 'CARD') ||
      typeof body.simulateFail !== 'boolean'
    ) {
      return errorResponse('Dữ liệu thanh toán Mock không hợp lệ.', 400);
    }
    const idempotencyKey = headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return errorResponse('Thiếu Idempotency-Key.', 400);
    }

    const existing = store.idempotencyKeys[idempotencyKey];
    if (existing) {
      const priorOrder = findOrder(store, existing.orderId);
      if (existing.orderId !== body.orderId) {
        return errorResponse('Idempotency-Key đã được dùng cho đơn khác.', 409);
      }
      if (!priorOrder) return errorResponse('Không tìm thấy đơn Mock.', 404);
      if (existing.status === 'PAYMENT_FAILED') {
        return jsonResponse({ success: true, status: 'PAYMENT_FAILED' });
      }
      return jsonResponse({
        success: true,
        status: 'PENDING',
        gateway: createMockPaymentSession(),
        mockEmail: null,
      });
    }

    const order = findOrder(store, body.orderId);
    if (!order) return errorResponse('Không tìm thấy đơn Mock.', 404);
    if (order.status !== 'PENDING') {
      return errorResponse('Đơn Mock không ở trạng thái chờ thanh toán.', 409);
    }

    const resultStatus = body.simulateFail ? 'PAYMENT_FAILED' : 'PAID';
    if (body.simulateFail) order.status = resultStatus;
    store.idempotencyKeys[idempotencyKey] = {
      orderId: order.id,
      status: resultStatus,
    };
    try {
      saveStore(userKey, store);
    } catch {
      return errorResponse('Không thể lưu kết quả thanh toán Mock trong phiên.', 500);
    }

    if (body.simulateFail) {
      return jsonResponse({ success: true, status: 'PAYMENT_FAILED' });
    }
    return jsonResponse({
      success: true,
      status: 'PENDING',
      gateway: createMockPaymentSession(),
      mockEmail: null,
    });
  }

  const statusMatch = url.pathname.match(/^\/payments\/orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'GET') {
    const orderId = decodeURIComponent(statusMatch[1]);
    const order = findOrder(store, orderId);
    if (!order) return errorResponse('Không tìm thấy đơn Mock.', 404);
    if (order.status === 'PENDING' && hasMockSuccess(store, order.id)) {
      order.status = 'PAID';
      try {
        saveStore(userKey, store);
      } catch {
        return errorResponse('Không thể lưu trạng thái thanh toán Mock.', 500);
      }
    }
    return jsonResponse({
      paymentStatus: order.status,
    });
  }

  const action = orderPath(url.pathname);
  if (action && method === 'PATCH') {
    const order = findOrder(store, action.orderId);
    if (!order) return errorResponse('Không tìm thấy đơn Mock.', 404);

    if (action.action === 'cancel') {
      if (order.status === 'PENDING' && hasMockSuccess(store, order.id)) {
        order.status = 'PAID';
      }
      if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
        if (order.status === 'PAID') {
          try {
            saveStore(userKey, store);
          } catch {
            return errorResponse('Không thể lưu trạng thái thanh toán Mock.', 500);
          }
        }
        return errorResponse('Trạng thái đơn Mock không cho phép hủy.', 409);
      }
      order.status = 'CANCELLED';
    } else {
      if (order.status !== 'PAYMENT_FAILED') {
        return errorResponse('Chỉ có thể thử lại đơn Mock thanh toán thất bại.', 409);
      }
      order.status = 'PENDING';
    }

    try {
      saveStore(userKey, store);
    } catch {
      return errorResponse('Không thể lưu trạng thái đơn Mock trong phiên.', 500);
    }
    return jsonResponse({ id: order.id, status: order.status });
  }

  return errorResponse('Mock Orders/Payments endpoint không được hỗ trợ.', 404);
}
