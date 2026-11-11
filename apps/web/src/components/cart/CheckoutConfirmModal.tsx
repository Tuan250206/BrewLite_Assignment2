'use client';

import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Wallet } from 'lucide-react';
import type { CartItem } from '@/stores/cartStore';

interface CheckoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (method: 'WALLET' | 'CARD', simulateFail: boolean) => void;
  items: CartItem[];
  totalPrice: number;
  loading: boolean;
  cancelError?: string | null;
  cancelling?: boolean;
}

export default function CheckoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  totalPrice,
  loading,
  cancelError,
  cancelling = false,
}: CheckoutConfirmModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'WALLET' | 'CARD' | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="checkout-confirm-title"
        aria-modal="true"
        aria-busy={loading}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          disabled={loading || cancelling}
          className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <h2
            id="checkout-confirm-title"
            className="text-lg font-bold text-stone-900"
          >
            Xác nhận thanh toán
          </h2>
          <p className="text-xs text-stone-500">
            Kiểm tra đơn hàng và chọn phương thức thanh toán
          </p>
        </div>

        <div className="my-3 max-h-40 divide-y divide-stone-100 overflow-y-auto border-y border-stone-100 py-1">
          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">
              Giỏ hàng hiện không có món nào.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold text-stone-800">
                    {item.name}{' '}
                    <span className="whitespace-nowrap text-stone-400">
                      x{item.quantity}
                    </span>
                  </p>
                  <p className="break-words text-[11px] text-stone-500">
                    {item.size ? `Size ${item.size}` : ''}
                    {item.topping && item.topping.length > 0
                      ? ` + ${item.topping.join(', ')}`
                      : ''}
                  </p>
                </div>
                <span className="shrink-0 font-medium text-stone-700">
                  {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                </span>
              </div>
            ))
          )}
        </div>

        <fieldset className="mb-4 space-y-2" disabled={loading}>
          <legend className="text-xs font-semibold text-stone-700">
            Phương thức thanh toán (mô phỏng, không giao dịch tiền thật):
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('WALLET')}
              aria-pressed={selectedMethod === 'WALLET'}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedMethod === 'WALLET'
                  ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Wallet className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold leading-none">Ví BrewLite</p>
                <p className="mt-1 text-[10px] text-stone-500">Mã nội bộ: WALLET</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('CARD')}
              aria-pressed={selectedMethod === 'CARD'}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedMethod === 'CARD'
                  ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <CreditCard className="h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-bold leading-none">Thẻ ngân hàng</p>
                <p className="mt-1 text-[10px] text-stone-500">Mã nội bộ: CARD</p>
              </div>
            </button>
          </div>
        </fieldset>
        {selectedMethod === 'WALLET' && (
          <div
            aria-live="polite"
            className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3"
            role="status"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-600 text-white">
                <Wallet aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950">Ví BrewLite</p>
                <p className="text-xs text-amber-800">
                  Mô phỏng thanh toán bằng ví. Không cần quét mã QR.
                </p>
              </div>
            </div>
          </div>
        )}
        {selectedMethod === 'CARD' && (
          <div
            aria-live="polite"
            className="mb-4 rounded-xl border border-stone-300 bg-stone-900 p-3 text-white"
            role="status"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Thẻ ngân hàng</p>
                <p className="mt-1 text-xs text-stone-300">
                  Mô phỏng thanh toán bằng thẻ
                </p>
              </div>
              <CreditCard aria-hidden="true" className="h-6 w-6 text-amber-300" />
            </div>
            <p className="mt-3 text-[11px] text-stone-300">
              Không nhập thông tin thẻ thật. Backend xử lý kết quả khi bạn xác nhận.
            </p>
          </div>
        )}
        {!selectedMethod && (
          <p className="mb-4 text-xs text-stone-500" role="status">
            Chọn phương thức thanh toán để tiếp tục.
          </p>
        )}

        <fieldset className="mb-4 space-y-2" disabled={loading}>
          <legend className="text-xs font-semibold text-stone-700">
            Kết quả mô phỏng yêu cầu:
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSimulateFail(false)}
              aria-pressed={!simulateFail}
              className={`rounded-xl border p-3 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                !simulateFail
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="block font-bold">SUCCESS</span>
              <span className="mt-1 block text-[10px] text-stone-500">
                simulateFail: false
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSimulateFail(true)}
              aria-pressed={simulateFail}
              className={`rounded-xl border p-3 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                simulateFail
                  ? 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-600'
                  : 'border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              <span className="block font-bold">FAILED</span>
              <span className="mt-1 block text-[10px] text-stone-500">
                simulateFail: true
              </span>
            </button>
          </div>
          <p className="text-[11px] text-stone-500" role="status">
            Đây là kịch bản gửi đến API. Kết quả thực tế chỉ hiển thị sau khi
            backend xác nhận.
          </p>
        </fieldset>

        <div className="mb-5 flex items-center justify-between gap-3 px-1">
          <span className="text-sm font-medium text-stone-600">Tổng thanh toán:</span>
          <span className="shrink-0 text-lg font-black text-amber-800">
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {cancelError && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800" role="alert">
            {cancelError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || cancelling}
            className="flex-1 rounded-xl border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={() => selectedMethod && onConfirm(selectedMethod, simulateFail)}
            disabled={loading || !selectedMethod || items.length === 0}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1b120d] py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#2a1b12] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <CheckCircle aria-hidden="true" className="h-4 w-4 text-emerald-400" />
            )}
            <span aria-live="polite">
              {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
