'use client';

import { AlertTriangle, X } from 'lucide-react';

interface OutOfStockModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function OutOfStockModal({
  isOpen,
  message,
  onClose,
}: OutOfStockModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="out-of-stock-title"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-[#fdfbf7] p-6 text-center shadow-2xl"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Đóng thông báo"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2
          id="out-of-stock-title"
          className="mt-4 text-xl font-bold text-stone-900"
        >
          Sản phẩm đã hết hàng
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Sản phẩm đã hết hàng. Vui lòng kiểm tra lại giỏ hàng.
        </p>
        {message && (
          <p className="mt-2 text-xs text-stone-500" role="status">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#1b120d] py-3 text-sm font-semibold text-[#f6d49a] transition hover:bg-[#2e1f17]"
        >
          Đã hiểu
        </button>
      </section>
    </div>
  );
}
