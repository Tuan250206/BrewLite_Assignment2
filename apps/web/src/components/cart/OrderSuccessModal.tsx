'use client';

import React from 'react';
import { CheckCircle, Copy, Check } from 'lucide-react';

interface OrderSuccessModalProps {
  orderId: string | null;
  onClose: () => void;
}

export default function OrderSuccessModal({ orderId, onClose }: OrderSuccessModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!orderId) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl border border-stone-200">
        {/* Icon thành công */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <CheckCircle className="h-8 w-8" />
        </div>

        <h3 className="text-lg font-bold text-stone-900">Đặt món thành công!</h3>
        <p className="mt-1 text-xs text-stone-500 leading-relaxed">
          Quán đã nhận đơn hàng và đang chuẩn bị đồ uống cho bạn.
        </p>
        <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wide text-emerald-700">
          PAID
        </span>

        {/* Khối hiển thị mã đơn + nút sao chép */}
        <div className="my-5 rounded-xl bg-stone-50 p-3.5 border border-stone-200 flex items-center justify-between">
          <div className="text-left">
            <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Mã đơn hàng
            </span>
            <span className="text-sm font-bold text-stone-800 font-mono">
              #{orderId.length > 10 ? orderId.slice(0, 8).toUpperCase() : orderId}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition active:scale-95"
            title="Sao chép mã đơn"
          >
            {copied ? (
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

        {/* Nút hoàn tất */}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-[#1b120d] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2a1b12] active:scale-[0.99]"
        >
          Tiếp tục đặt món
        </button>
      </div>
    </div>
  );
}