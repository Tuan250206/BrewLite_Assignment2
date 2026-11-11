'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Package, RefreshCw, X } from 'lucide-react';
import {
  fetchMyOrders,
  OrdersApiError,
  type OrderHistoryEntry,
  type OrderStatus,
} from '@/lib/orders-api';

type PageState =
  | { kind: 'loading' }
  | { kind: 'unauthenticated' }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; orders: OrderHistoryEntry[] };

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PREPARING: 'Đang pha chế',
  READY: 'Sẵn sàng nhận',
  COMPLETED: 'Hoàn thành',
  PAYMENT_FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy',
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  PREPARING: 'bg-sky-100 text-sky-800',
  READY: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-stone-200 text-stone-700',
  PAYMENT_FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-stone-200 text-stone-500',
};

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('vi-VN')} đ`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Không rõ thời gian'
    : date.toLocaleString('vi-VN');
}

export default function OrdersPage() {
  const [pageState, setPageState] = useState<PageState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelConfirmationOrderId, setCancelConfirmationOrderId] = useState<
    string | null
  >(null);

  const loadOrders = useCallback(async (signal: AbortSignal): Promise<PageState | null> => {
    const token = window.localStorage.getItem('accessToken');
    if (!token) {
      return { kind: 'unauthenticated' };
    }

    try {
      const orders = await fetchMyOrders(token, signal);
      return { kind: 'loaded', orders };
    } catch (error) {
      if (signal.aborted) return null;
      if (error instanceof OrdersApiError && error.kind === 'unavailable') {
        return { kind: 'unavailable', message: error.message };
      }
      return {
        kind: 'error',
        message:
          error instanceof OrdersApiError
            ? error.message
            : 'Đã xảy ra lỗi khi tải lịch sử đơn hàng.',
      };
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadOrders(controller.signal).then((nextState) => {
      if (nextState && !controller.signal.aborted) setPageState(nextState);
    });
    return () => controller.abort();
  }, [loadOrders, reloadKey]);

  const handleRetry = () => {
    setPageState({ kind: 'loading' });
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang chủ
        </Link>

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">
            Lịch sử đơn hàng
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Theo dõi các đơn hàng đã đặt.
          </p>
        </header>

        {pageState.kind === 'loading' && (
          <div
            className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600"
            role="status"
          >
            Đang tải lịch sử đơn hàng...
          </div>
        )}

        {pageState.kind === 'unauthenticated' && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h2 className="font-semibold text-stone-900">
              Bạn cần đăng nhập để xem đơn hàng
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Hãy đăng nhập từ trang chủ rồi mở lại lịch sử đơn hàng.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-xl bg-[#1b120d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a1b12]"
            >
              Về trang chủ
            </Link>
          </section>
        )}

        {(pageState.kind === 'unavailable' || pageState.kind === 'error') && (
          <section
            className={`rounded-2xl border p-6 text-center ${
              pageState.kind === 'unavailable'
                ? 'border-amber-200 bg-amber-50'
                : 'border-red-200 bg-red-50'
            }`}
            role="alert"
          >
            <h2 className="font-semibold text-stone-900">
              {pageState.kind === 'unavailable'
                ? 'Lịch sử đơn hàng chưa khả dụng'
                : 'Không thể tải đơn hàng'}
            </h2>
            <p className="mt-2 text-sm text-stone-600">{pageState.message}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </section>
        )}

        {pageState.kind === 'loaded' &&
          (pageState.orders.length === 0 ? (
            <section className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-stone-400" />
              <h2 className="mt-3 font-semibold text-stone-900">
                Bạn chưa có đơn hàng nào
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Các đơn hàng của bạn sẽ hiển thị tại đây.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex rounded-xl bg-[#1b120d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a1b12]"
              >
                Xem thực đơn
              </Link>
            </section>
          ) : (
            <div className="space-y-4">
              {pageState.orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-stone-900">
                        Đơn hàng #{order.id.slice(0, 8)}
                      </h2>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <ul className="mt-4 divide-y divide-stone-100 border-y border-stone-100">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 text-sm"
                      >
                        <span className="text-stone-700">
                          {item.product?.name ?? 'Sản phẩm'} · Size {item.size}
                          {item.topping ? ` · ${item.topping}` : ''} × {item.qty}
                        </span>
                        <span className="font-medium text-stone-800">
                          {formatCurrency(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex justify-between gap-4 text-sm">
                    <span className="text-stone-600">Tổng cộng</span>
                    <span className="font-bold text-stone-900">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  {(order.status === 'PENDING' ||
                    order.status === 'PAYMENT_FAILED') && (
                    <div className="mt-4 border-t border-stone-100 pt-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setCancelConfirmationOrderId(order.id)
                          }
                          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Hủy đơn
                        </button>
                        {order.status === 'PAYMENT_FAILED' && (
                          <button
                            type="button"
                            disabled
                            aria-describedby={`retry-unavailable-${order.id}`}
                            className="cursor-not-allowed rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white opacity-50"
                          >
                            Thử thanh toán lại
                          </button>
                        )}
                      </div>
                      <p
                        id={
                          order.status === 'PAYMENT_FAILED'
                            ? `retry-unavailable-${order.id}`
                            : undefined
                        }
                        className="mt-2 text-right text-xs text-stone-500"
                      >
                        Các thao tác đang chờ API Orders/Payments của TV3.
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ))}
      </div>

      {cancelConfirmationOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section
            aria-labelledby="cancel-order-title"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl"
            role="dialog"
          >
            <button
              type="button"
              aria-label="Đóng xác nhận hủy đơn"
              onClick={() => setCancelConfirmationOrderId(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h2
              id="cancel-order-title"
              className="pr-8 text-lg font-bold text-stone-900"
            >
              Xác nhận hủy đơn
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Mã đơn: #{cancelConfirmationOrderId.slice(0, 8)}
            </p>
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Chưa thể gửi yêu cầu hủy. Backend Assignment 2 chưa có API
                Orders; đơn hàng chưa bị thay đổi.
              </p>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelConfirmationOrderId(null)}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white opacity-50"
              >
                Chờ API TV3
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
