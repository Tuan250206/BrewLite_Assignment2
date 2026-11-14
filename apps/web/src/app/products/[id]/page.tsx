'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from "@/stores/cartStore";
import AddToCartModal from "@/components/cart/AddToCartModal";
import { getProductImageUrl } from "@/lib/product-image";
import { API_BASE_URL } from "@/lib/api-base";

// Danh sách Option / Topping
const SIZE_OPTIONS = [
  { id: 'S', name: 'Small', extraPrice: -5000 },
  { id: 'M', name: 'Medium', extraPrice: 0 },
  { id: 'L', name: 'Large', extraPrice: 10000 },
];

const TOPPING_OPTIONS = [
  { id: 'tp1', name: 'Trân châu đen', price: 10000 },
  { id: 'tp2', name: 'Thạch trái cây', price: 8000 },
  { id: 'tp3', name: 'Cream Cheese', price: 15000 },
  { id: 'tp4', name: 'Pudding trứng', price: 10000 },
];

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id;

  const addItem = useCartStore((state) => state.addItem);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // State dữ liệu sản phẩm từ Backend
    const [product, setProduct] = useState<{
    id: string | number;
    name: string;
    price: number;
    imageUrl?: string | null;
    image?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // State lựa chọn của người dùng
  const [selectedSize, setSelectedSize] = useState(SIZE_OPTIONS[1]); // Mặc định Size M
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // 1. Gọi API lấy thông tin sản phẩm từ NestJS Backend
  useEffect(() => {
    if (!productId) return;

    fetch(`${API_BASE_URL}/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không tìm thấy sản phẩm');
        return res.json();
      })
      .then((data) => {
        const price = Number(data.price);
        if (!Number.isFinite(price)) {
          throw new Error('Giá sản phẩm không hợp lệ');
        }
        setProduct({ ...data, price });
        setLoading(false);
      })
            .catch((err) => {
        console.error('Lỗi khi fetch sản phẩm:', err);
        setProduct(null);
        setLoading(false);
      });
  }, [productId]);

  // Xử lý Chọn / Bỏ chọn Topping
  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  // Tính giá đơn vị sản phẩm (Giá gốc + Size + Topping)
  const unitPrice = useMemo(() => {
    const base = product?.price ?? 45000;
    const toppingTotal = selectedToppings.reduce((sum, tId) => {
      const item = TOPPING_OPTIONS.find((t) => t.id === tId);
      return sum + (item ? item.price : 0);
    }, 0);

    return base + selectedSize.extraPrice + toppingTotal;
  }, [product, selectedSize, selectedToppings]);

  // Tổng tiền = Giá đơn vị x Số lượng
  const totalPrice = unitPrice * quantity;

  // Xử lý Thêm vào giỏ hàng qua Zustand Store
  const handleAddToCart = () => {
    if (!product) return;

    // Ghép topping thành chuỗi (ví dụ: "Trân châu đen, Pudding trứng")
    const toppingNames = selectedToppings
      .map((tId) => TOPPING_OPTIONS.find((t) => t.id === tId)?.name)
      .filter((name): name is string => Boolean(name));
    addItem({
      productId: String(product.id),
      name: product.name,
      size: selectedSize.id as "S" | "M" | "L",
      topping: toppingNames.length > 0 ? toppingNames : undefined,
      unitPrice: unitPrice, // Giá 1 ly đã tính kèm size và topping
      quantity: quantity,
    });

    setShowSuccessModal(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-12 text-center text-gray-500 font-medium">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }
  if (!product) {
   return (
     <div className="container mx-auto p-12 text-center">
       <p className="text-lg font-semibold text-red-600 mb-4">
         Không tìm thấy sản phẩm yêu cầu (404).
       </p>
       <Link href="/" className="text-amber-700 underline font-medium">
         ← Quay lại thực đơn
       </Link>
     </div>
   );
 }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:border-stone-400 active:scale-95"
        >
          <span className="text-base leading-none">←</span>
          <span>Quay lại thực đơn</span>
        </Link>
      </div>
      
      <div className="mb-6">
        <span className="text-lg font-semibold uppercase tracking-wider text-amber-700">
          Chi tiết sản phẩm
        </span>
        <h1 className="mt-1 text-4xl font-extrabold text-stone-900">
          {product?.name || "Đang tải tên món..."}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow-md border">
        {/* Khung ảnh sản phẩm */}
        <div className="bg-amber-50 rounded-xl h-80 flex flex-col items-center justify-center border border-amber-200 overflow-hidden relative">
          {product?.imageUrl || product?.image ? (
                      <Image
            src={getProductImageUrl(product.imageUrl || product.image)}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full object-cover"
          />
          ) : (
            <>
              <span className="text-5xl mb-3">🧋</span>
              <span className="text-gray-500 font-medium px-4 text-center">
                {product?.name}
              </span>
            </>
          )}
        </div>

        {/* Tùy chọn sản phẩm */}
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product?.name}</h2>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {totalPrice.toLocaleString('vi-VN')}đ
            </p>
          </div>

          {/* 1. Chọn Size */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Kích thước (Size):
            </label>
            <div className="flex gap-3">
              {SIZE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSize(item)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    selectedSize.id === item.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300'
                  }`}
                >
                  {item.name}
                  {item.extraPrice !== 0 && (
                    <span className="block text-xs opacity-80">
                      ({item.extraPrice > 0 ? '+' : ''}
                      {item.extraPrice.toLocaleString('vi-VN')}đ)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Chọn Topping */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Topping thêm:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TOPPING_OPTIONS.map((tp) => (
                <label
                  key={tp.id}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer text-sm transition ${
                    selectedToppings.includes(tp.id)
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedToppings.includes(tp.id)}
                      onChange={() => toggleTopping(tp.id)}
                      className="accent-amber-600"
                    />
                    <span>{tp.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    +{tp.price.toLocaleString('vi-VN')}đ
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Chọn Số lượng */}
          <div className="flex items-center justify-between pt-2">
            <label className="font-semibold text-gray-700">Số lượng:</label>
            <div className="flex items-center border rounded-lg border-gray-300 overflow-hidden bg-white focus-within:border-amber-600 focus-within:ring-1 focus-within:ring-amber-600">
              {/* Nút Giảm (-) */}
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition select-none active:bg-gray-300"
              >
                -
              </button>

              {/* Ô số ở giữa: vừa hiển thị vừa cho bấm vào nhập số trực tiếp */}
              <input
                type="number"
                min={1}
                value={quantity === 0 ? '' : quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val <= 0) {
                    setQuantity(0); // Cho phép xóa trắng để người dùng gõ số mới
                  } else {
                    setQuantity(val);
                  }
                }}
                onBlur={() => {
                  // Khi bấm ra ngoài, nếu đang để trống hoặc số 0 thì tự phục hồi về 1
                  if (quantity < 1) setQuantity(1);
                }}
                className="w-14 text-center font-semibold text-gray-800 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />

              {/* Nút Tăng (+) */}
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 font-bold text-gray-600 transition select-none active:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>

          {/* Nút Thêm vào giỏ hàng */}
          <button
            onClick={handleAddToCart}
            className="w-full py-3 bg-amber-600 text-white font-bold rounded-lg shadow hover:bg-amber-700 active:scale-[0.99] transition"
          >
            Thêm vào giỏ hàng • {totalPrice.toLocaleString('vi-VN')}đ
          </button>
        </div>
      </div>

      <AddToCartModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        productName={product?.name || "Món đồ uống"}
        quantity={quantity}
      />
    </div>
  );
}
