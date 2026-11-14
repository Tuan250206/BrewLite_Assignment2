'use client';

import React from 'react';
import { CheckCircle, Copy, Check } from 'lucide-react';

interface OrderSuccessModalProps {
  orderId: string | null;
  onClose: () => void;
}

export default function OrderSuccessModal({
  orderId,
  onClose,
}: OrderSuccessModalProps) {
  const [copiedOrderId, setCopiedOrderId] = React.useState<string | null>(null);
  const [copyError, setCopyError] = React.useState('');
  const [copying, setCopying] = React.useState(false);

  if (!orderId) return null;

  const handleCopy = async () => {
    setCopyError('');
    setCopying(true);
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);
    } catch {
      setCopyError('Không thể sao chép mã đơn trên trình duyệt này.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="order-success-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-2xl sm:p-6"
        role="dialog"
      >
        {/* Icon thành công */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h2
          id="order-success-title"
          className="text-lg font-bold text-stone-900"
        >
          Thanh toán thành công
        </h2>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          Hệ thống đã xác nhận kết quả SUCCESS và đơn hàng ở trạng thái PAID.
        </p>
        <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wide text-emerald-700">
          SUCCESS · PAID
        </span>

        {/* Khối hiển thị mã đơn + nút sao chép */}
        <div className="my-5 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3.5">
          <div className="min-w-0 text-left">
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Mã đơn hàng
            </span>
            <span className="break-all font-mono text-sm font-bold text-stone-800">
              #{orderId.length > 10 ? orderId.slice(0, 8).toUpperCase() : orderId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 transition hover:bg-stone-100 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            title="Sao chép mã đơn"
          >
            {copying ? (
              <span>Đang sao chép...</span>
            ) : copiedOrderId === orderId ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
        {copyError && (
          <p aria-live="polite" className="mb-4 text-xs text-red-600" role="alert">
            {copyError}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-[#1b120d] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2a1b12] active:scale-[0.99]"
        >
          Tiếp tục đặt món
        </button>
      </section>
    </div>
  );
}