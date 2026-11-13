import { orderPaymentFetch } from './order-payment-api';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export type OrderAction = 'cancel' | 'retry-payment';

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

export const API_BASE_URL =
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

// Trích thông báo lỗi từ body JSON của NestJS (message có thể là string hoặc mảng).
export function getApiErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data) || !('message' in data)) return fallback;
  const raw = data.message;
  if (typeof raw === 'string' && raw.trim() !== '') return raw;
  if (Array.isArray(raw)) {
    const parts = raw.filter((part): part is string => typeof part === 'string');
    if (parts.length > 0) return parts.join(', ');
  }
  return fallback;
}

// Prisma Decimal (total, lineTotal) được JSON serialize thành string,
// còn cột Int (qty) là number. Chuẩn hoá cả hai về number.
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseOrderItem(value: unknown): OrderHistoryItem | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.productId !== 'string' ||
    typeof value.size !== 'string'
  ) {
    return null;
  }

  const qty = toNumber(value.qty);
  const lineTotal = toNumber(value.lineTotal);
  if (qty === null || lineTotal === null) return null;

  const product =
    value.product === null
      ? null
      : isRecord(value.product) && typeof value.product.name === 'string'
        ? { name: value.product.name }
        : undefined;

  const topping =
    typeof value.topping === 'string' && value.topping.trim() !== ''
      ? value.topping
      : null;

  return {
    id: value.id,
    productId: value.productId,
    product,
    size: value.size,
    topping,
    qty,
    lineTotal,
  };
}

function parseOrder(value: unknown): OrderHistoryEntry | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isOrderStatus(value.status) ||
    typeof value.createdAt !== 'string'
  ) {
    return null;
  }

  const total = toNumber(value.total);
  if (total === null) return null;

  // Backend trả quan hệ tên `orderItems` (Prisma include), không phải `items`.
  const rawItems = value.orderItems;
  if (!Array.isArray(rawItems)) return null;

  const items: OrderHistoryItem[] = [];
  for (const item of rawItems) {
    const parsedItem = parseOrderItem(item);
    if (!parsedItem) return null;
    items.push(parsedItem);
  }

  return {
    id: value.id,
    status: value.status,
    total,
    createdAt: value.createdAt,
    items,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function fetchMyOrders(
  token: string,
  signal?: AbortSignal,
): Promise<OrderHistoryEntry[]> {
  let response: Response;
  const requestController = new AbortController();
  const abortFromCaller = () => requestController.abort();
  if (signal?.aborted) {
    requestController.abort();
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  const timeoutId = globalThis.setTimeout(
    () => requestController.abort(),
    15_000,
  );

  try {
    response = await orderPaymentFetch(`${API_BASE_URL}/orders/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: requestController.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (requestController.signal.aborted) {
      throw new OrdersApiError(
        'Tải lịch sử đơn hàng quá thời gian chờ. Vui lòng thử lại.',
        'unavailable',
      );
    }
    throw new OrdersApiError(
      'Không thể kết nối tới dịch vụ đơn hàng. Vui lòng thử lại sau.',
      'unavailable',
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
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

  const data = await readJson(response);
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

export async function updateMyOrder(
  token: string,
  orderId: string,
  action: OrderAction,
  signal?: AbortSignal,
): Promise<OrderHistoryEntry> {
  let response: Response;
  try {
    response = await orderPaymentFetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/${action}`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new OrdersApiError(
      'Không thể kết nối tới dịch vụ đơn hàng. Vui lòng thử lại sau.',
      'unavailable',
    );
  }

  const data = await readJson(response);

  if (response.status === 401 || response.status === 403) {
    throw new OrdersApiError(
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
      'unauthorized',
    );
  }
  if (!response.ok) {
    throw new OrdersApiError(
      getApiErrorMessage(data, 'Không thể cập nhật đơn hàng.'),
      'request',
    );
  }

  const parsedOrder = parseOrder(data);
  if (!parsedOrder) {
    throw new OrdersApiError(
      'Dịch vụ đơn hàng trả về dữ liệu không hợp lệ.',
      'invalid-response',
    );
  }

  return parsedOrder;
}
