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
}

export default function CheckoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  totalPrice,
  loading,
}: CheckoutConfirmModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'WALLET' | 'CARD' | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-2">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">Xác nhận thanh toán</h3>
          <p className="text-xs text-stone-500">Kiểm tra thông tin món và chọn phương thức thanh toán</p>
        </div>

        {/* Danh sách món tóm tắt */}
        <div className="max-h-40 overflow-y-auto divide-y divide-stone-100 border-y border-stone-100 my-3 py-1">
          {items.map((item, idx) => (
            <div key={idx} className="py-2 flex justify-between items-start text-xs">
              <div>
                <p className="font-semibold text-stone-800">
                  {item.name} <span className="text-stone-400">x{item.quantity}</span>
                </p>
                <p className="text-[11px] text-stone-500">
                  {item.size ? `Size ${item.size}` : ''}
                  {item.topping && item.topping.length > 0 ? ` + ${item.topping.join(', ')}` : ''}
                </p>
              </div>
              <span className="font-medium text-stone-700">
                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
              </span>
            </div>
          ))}
        </div>

        {/* Lựa chọn phương thức thanh toán */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-semibold text-stone-700">Chọn phương thức thanh toán:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('WALLET')}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                selectedMethod === 'WALLET'
                  ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <Wallet className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-bold leading-none">Ví điện tử</p>
                <p className="text-[10px] text-stone-500 mt-1">MoMo / ZaloPay</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('CARD')}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                selectedMethod === 'CARD'
                  ? 'border-amber-600 bg-amber-50/50 text-amber-900 ring-1 ring-amber-600'
                  : 'border-stone-200 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-bold leading-none">Thẻ ngân hàng</p>
                <p className="text-[10px] text-stone-500 mt-1">ATM / Thẻ quốc tế</p>
              </div>
            </button>
          </div>
        </div>

        <label className="mb-4 flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
          <input
            type="checkbox"
            checked={simulateFail}
            onChange={(event) => setSimulateFail(event.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-xs text-stone-600">
            Mô phỏng thanh toán thất bại (kiểm thử PAYMENT_FAILED)
          </span>
        </label>

        {/* Tổng tiền */}
        <div className="flex justify-between items-center mb-5 px-1">
          <span className="text-sm font-medium text-stone-600">Tổng thanh toán:</span>
          <span className="text-lg font-black text-amber-800">
            {totalPrice.toLocaleString('vi-VN')}đ
          </span>
        </div>

        {/* Nút thao tác */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-50 transition"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={() => selectedMethod && onConfirm(selectedMethod, simulateFail)}
            disabled={loading || !selectedMethod}
            className="flex-1 py-2.5 rounded-xl bg-[#1b120d] text-white font-semibold text-xs hover:bg-[#2a1b12] shadow transition active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{loading ? 'Đang xử lý...' : 'Thanh toán ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}