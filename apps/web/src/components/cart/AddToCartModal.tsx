"use client";

import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  quantity: number;
}

export default function AddToCartModal({
  isOpen,
  onClose,
  productName,
  quantity,
}: AddToCartModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-[#fdfbf7] p-6 shadow-2xl transition-all">
        {/* Icon tone Nâu / Vàng Cà phê */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b120d] text-[#f6d49a] shadow-md">
            <Check size={28} strokeWidth={2.5} />
          </div>
          
          <h3 className="mt-4 text-xl font-bold tracking-tight text-stone-900">
            Đã thêm vào giỏ hàng
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Bạn vừa thêm{" "}
            <span className="font-semibold text-stone-900">
              {quantity}x {productName}
            </span>{" "}
            vào giỏ hàng thành công.
          </p>
        </div>

        {/* Các nút bấm chuẩn style Coffee House */}
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b120d] py-3 text-sm font-semibold text-[#f6d49a] shadow-sm transition hover:bg-[#2e1f17] active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            <span>Xem giỏ & Tiếp tục chọn món</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100 active:scale-[0.98]"
          >
            Ở lại trang này
          </button>
        </div>
      </div>
    </div>
  );
}