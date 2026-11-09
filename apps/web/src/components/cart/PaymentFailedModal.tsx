'use client';

import { AlertCircle } from 'lucide-react';

interface PaymentFailedModalProps {
  orderId: string | null;
  loading: boolean;
  onRetry: () => void;
  onCancel: () => void;
}

export default function PaymentFailedModal({
  orderId,
  loading,
  onRetry,
  onCancel,
}: PaymentFailedModalProps) {
  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="payment-failed-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-stone-200 bg-[#fdfbf7] p-6 text-center shadow-2xl"
        role="dialog"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2
          id="payment-failed-title"
          className="mt-4 text-xl font-bold text-stone-900"
        >
          Thanh toán thất bại
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Giao dịch không thành công. Vui lòng thử lại hoặc hủy đơn hàng.
        </p>
        <p className="mt-3 text-xs text-stone-500">
          Mã đơn: <span className="font-mono font-semibold">{orderId}</span>
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-stone-300 bg-white py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Hủy đơn'}
          </button>
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#1b120d] py-3 text-sm font-semibold text-[#f6d49a] transition hover:bg-[#2e1f17] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Thử lại'}
          </button>
        </div>
      </section>
    </div>
  );
}
