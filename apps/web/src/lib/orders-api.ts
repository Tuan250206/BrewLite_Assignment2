export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface OrderHistoryItem {
  id: string;
  productId: string;
  product?: { name: string } | null;
  size: string;
  topping?: string | null;
  qty: number;
  lineTotal: number;
}

export interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderHistoryItem[];
}

export class OrdersApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'unavailable' | 'unauthorized' | 'request' | 'invalid-response',
  ) {
    super(message);
    this.name = 'OrdersApiError';
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

const ORDER_STATUSES: ReadonlySet<string> = new Set([
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'PAYMENT_FAILED',
  'CANCELLED',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && ORDER_STATUSES.has(value);
}

function parseOrderItem(value: unknown): OrderHistoryItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.productId !== 'string' ||
    typeof value.size !== 'string' ||
    typeof value.qty !== 'number' ||
    !Number.isFinite(value.qty) ||
    typeof value.lineTotal !== 'number' ||
    !Number.isFinite(value.lineTotal)
  ) {
    return null;
  }

  const product =
    value.product === null
      ? null
      : isRecord(value.product) && typeof value.product.name === 'string'
        ? { name: value.product.name }
        : undefined;

  return {
    id: value.id,
    productId: value.productId,
    product,
    size: value.size,
    topping: typeof value.topping === 'string' ? value.topping : null,
    qty: value.qty,
    lineTotal: value.lineTotal,
  };
}

function parseOrder(value: unknown): OrderHistoryEntry | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isOrderStatus(value.status) ||
    typeof value.total !== 'number' ||
    !Number.isFinite(value.total) ||
    typeof value.createdAt !== 'string' ||
    !Array.isArray(value.items)
  ) {
    return null;
  }

  const items: OrderHistoryItem[] = [];
  for (const item of value.items) {
    const parsedItem = parseOrderItem(item);
    if (!parsedItem) return null;
    items.push(parsedItem);
  }

  return {
    id: value.id,
    status: value.status,
    total: value.total,
    createdAt: value.createdAt,
    items,
  };
}

export async function fetchMyOrders(
  token: string,
  signal?: AbortSignal,
): Promise<OrderHistoryEntry[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/orders/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new OrdersApiError(
      'Không thể kết nối tới dịch vụ đơn hàng. Vui lòng thử lại sau.',
      'unavailable',
    );
  }

  if (response.status === 404) {
    throw new OrdersApiError(
      'Dịch vụ lịch sử đơn hàng chưa khả dụng trong phiên bản này.',
      'unavailable',
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new OrdersApiError(
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      'unauthorized',
    );
  }
  if (!response.ok) {
    throw new OrdersApiError(
      'Không thể tải lịch sử đơn hàng. Vui lòng thử lại.',
      'request',
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new OrdersApiError(
      'Dịch vụ đơn hàng trả về dữ liệu không hợp lệ.',
      'invalid-response',
    );
  }

  if (!Array.isArray(data)) {
    throw new OrdersApiError(
      'Dịch vụ đơn hàng trả về dữ liệu không hợp lệ.',
      'invalid-response',
    );
  }

  const orders: OrderHistoryEntry[] = [];
  for (const order of data) {
    const parsedOrder = parseOrder(order);
    if (!parsedOrder) {
      throw new OrdersApiError(
        'Dịch vụ đơn hàng trả về dữ liệu không hợp lệ.',
        'invalid-response',
      );
    }
    orders.push(parsedOrder);
  }

  return orders;
}
