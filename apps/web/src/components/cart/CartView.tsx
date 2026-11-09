"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalPrice = useCartStore((state) => state.totalPrice);

  if (items.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
          Giỏ hàng trống
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Thêm đồ uống từ menu để bắt đầu đặt hàng.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Giỏ hàng
        </h2>
      </div>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                {item.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Size {item.size}
                {item.topping?.length ? ` • ${item.topping.join(", ")}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                {formatPrice(item.unitPrice)} / ly
              </p>
            </div>

            <div className="flex flex-col items-end justify-between gap-3">
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                aria-label={`Xóa ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="rounded-full p-1 text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label={`Giảm số lượng ${item.name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-6 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="rounded-full p-1 text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  aria-label={`Tăng số lượng ${item.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {formatPrice(item.unitPrice * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="text-base font-medium text-zinc-600 dark:text-zinc-300">
          Tổng tiền
        </span>
        <span className="text-xl font-bold text-amber-700 dark:text-amber-400">
          {formatPrice(totalPrice())}
        </span>
      </div>
    </div>
  );
}
