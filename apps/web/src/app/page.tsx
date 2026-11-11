"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee, Plus, ShoppingBag, Loader2, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/product-image";
import Link from "next/link";
import { useCartStore, type CartItem } from "@/stores/cartStore";
import UserNav from "@/components/layout/UserNav";
import AuthModal from "@/components/auth/AuthModal";
import CheckoutConfirmModal from '@/components/cart/CheckoutConfirmModal';
import OrderSuccessModal from '@/components/cart/OrderSuccessModal';
import OutOfStockModal from '@/components/cart/OutOfStockModal';
import PaymentFailedModal from '@/components/cart/PaymentFailedModal';
import { fetchMyOrders, getApiErrorMessage } from '@/lib/orders-api';

const EXIT_CANCEL_NOTICE_KEY = 'brewlite-pending-cancel-notice';

interface BackendProduct {
  id: string | number;
  name: string;
  price: number;
  imageUrl?: string;
  stock: number;
}

type BackendProductResponse = Omit<BackendProduct, 'price'> & {
  price: number | string;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function getCancellationStatus(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  if ('status' in data && typeof data.status === 'string') return data.status;
  if (
    'order' in data &&
    typeof data.order === 'object' &&
    data.order !== null &&
    'status' in data.order &&
    typeof data.order.status === 'string'
  ) {
    return data.order.status;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Sau khi POST /payments trả SUCCESS, gọi thêm 1 lần để đối chiếu trạng thái đơn
// với backend trước khi báo thành công cho khách.
async function fetchOrderStatusAfterPayment(
  orderId: string,
  token: string,
): Promise<string | null> {
  try {
    const response = await fetch(
      `http://localhost:3001/payments/orders/${encodeURIComponent(orderId)}/status`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (!isRecord(data)) return null;
    if (typeof data.orderStatus === 'string') return data.orderStatus;
    if (typeof data.status === 'string') return data.status;
    return null;
  } catch {
    return null;
  }
}

async function fetchProducts(): Promise<BackendProduct[]> {
  const response = await fetch("http://localhost:3001/products");
  if (!response.ok) {
    throw new Error("Lỗi khi tải danh sách sản phẩm");
  }

  const products: BackendProductResponse[] = await response.json();
  return products.map((product) => {
    const price = Number(product.price);
    if (!Number.isFinite(price)) {
      throw new Error(`Giá sản phẩm không hợp lệ: ${product.name}`);
    }
    return { ...product, price };
  });
}

export default function Home() {
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);
  const addItem = useCartStore((state) => state.addItem);
  const [currentUser, setCurrentUser] = useState<{ id?: string; email?: string } | null>(null);  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [outOfStockMessage, setOutOfStockMessage] = useState<string | null>(null);
  const [paymentFailedOrderId, setPaymentFailedOrderId] = useState<string | null>(null);
  const [isUpdatingFailedOrder, setIsUpdatingFailedOrder] = useState(false);
  const [checkoutModalKey, setCheckoutModalKey] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [retryOrder, setRetryOrder] = useState<{
    id: string;
    items: CartItem[];
    total: number;
  } | null>(null);
  const [pendingCancelError, setPendingCancelError] = useState<string | null>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [exitCancelNotice, setExitCancelNotice] = useState<string | null>(null);
  const cancellationInFlightRef = useRef(false);
  
  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
    setProductsError(null);
  };

    useEffect(() => {
    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setProductsError(null);
      })
      .catch((err) => {
        console.error("Lỗi fetch products:", err);
        setProductsError("Không thể tải thực đơn. Vui lòng thử tải lại trang.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    const userStr = sessionStorage.getItem('currentUser');
    if (token && userStr) {
      queueMicrotask(() => {
        try {
          setCurrentUser(JSON.parse(userStr));
        } catch {
          setCurrentUser(null);
        }
      });
    }
  }, []);

  useEffect(() => {
    const storedNotice = window.sessionStorage.getItem(EXIT_CANCEL_NOTICE_KEY);
    if (!storedNotice) return;

    queueMicrotask(() => {
      setExitCancelNotice(
        `Đã gửi yêu cầu hủy đơn ${storedNotice} khi rời luồng thanh toán, nhưng chưa nhận được xác nhận từ backend. Hãy kiểm tra Lịch sử đơn hàng.`,
      );
      window.sessionStorage.removeItem(EXIT_CANCEL_NOTICE_KEY);
    });
  }, []);

  useEffect(() => {
    const retryOrderId = new URLSearchParams(window.location.search).get(
      'retryOrderId',
    );
    if (!retryOrderId) return;

    const token = window.sessionStorage.getItem('accessToken');
    if (!token) {
      queueMicrotask(() => setShowAuthModal(true));
      return;
    }

    const controller = new AbortController();
    void fetchMyOrders(token, controller.signal)
      .then((orders) => {
        const order = orders.find((candidate) => candidate.id === retryOrderId);
        if (!order || !['PAYMENT_FAILED', 'PENDING'].includes(order.status)) {
          throw new Error('Đơn hàng không còn ở trạng thái có thể thanh toán lại.');
        }
        if (
          order.items.length === 0 ||
          order.items.some((item) => item.qty < 1)
        ) {
          throw new Error('Thông tin món trong đơn hàng không hợp lệ.');
        }

        const checkoutItems: CartItem[] = order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.product?.name ?? 'Sản phẩm',
          size: item.size as CartItem['size'],
          topping: item.topping
            ? item.topping.split(',').map((name) => name.trim()).filter(Boolean)
            : null,
          quantity: item.qty,
          unitPrice: item.lineTotal / item.qty,
        }));

        window.history.replaceState(window.history.state, '', window.location.pathname);
        setRetryOrder({ id: order.id, items: checkoutItems, total: order.total });
        setPendingOrderId(order.id);
        setPendingCancelError(null);
        setCheckoutModalKey((key) => key + 1);
        setShowConfirmModal(true);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        alert(
          error instanceof Error
            ? error.message
            : 'Không thể tải đơn hàng để thanh toán lại.',
        );
      });

    return () => controller.abort();
  }, [currentUser]);

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('currentUser');
    clearCart();
    setCurrentUser(null);
  };

  const handleCheckoutClick = async () => {
    if (cartList.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setIsCheckingOut(true);
    try {
      // 1. Tạo đơn hàng (Trạng thái ban đầu: PENDING)
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.productId,
          size: item.size,
          topping: Array.isArray(item.topping) && item.topping.length > 0 ? item.topping : undefined,
          qty: item.quantity,
        })),
      };

      const orderRes = await fetch('http://localhost:3001/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const orderData: unknown = await orderRes.json().catch(() => null);
      if (!orderRes.ok) {
        throw new Error(getApiErrorMessage(orderData, 'Tạo đơn hàng thất bại'));
      }
      if (!isRecord(orderData) || orderData.id === undefined) {
        throw new Error('Dịch vụ đơn hàng trả về dữ liệu không hợp lệ.');
      }

      setCheckoutModalKey((key) => key + 1);
      setPendingCancelError(null);
      setPendingOrderId(String(orderData.id));

      setShowConfirmModal(true);
      } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';

      if (/stock|tồn kho|hết hàng|hết sản phẩm/i.test(message)) {
        setOutOfStockMessage(message);
      } else {
        alert(message || 'Đã xảy ra lỗi khi tạo đơn hàng.');
      }
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  const handleConfirmOrder = async (
    method: 'WALLET' | 'CARD',
    simulateFail: boolean,
  ) => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setShowConfirmModal(false);
      setShowAuthModal(true);
      return;
    }

    const orderId = pendingOrderId;
    if (!orderId) {
      alert('Không tìm thấy mã đơn hàng cần thanh toán!');
      return;
    }

    setIsCheckingOut(true);
    try {
      // 2. Gửi yêu cầu thanh toán mô phỏng; backend gọi Mock Gateway và trả kết quả đồng bộ.
      const paymentRes = await fetch('http://localhost:3001/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          orderId,
          method: method,
          simulateFail,
        }),
      });

      const paymentData: unknown = await paymentRes.json().catch(() => null);

      if (!paymentRes.ok) {
        throw new Error(
          getApiErrorMessage(paymentData, 'Không thể khởi tạo thanh toán'),
        );
      }

      const paymentStatus =
        isRecord(paymentData) && typeof paymentData.status === 'string'
          ? paymentData.status
          : null;

      if (paymentStatus === 'FAILED' || paymentStatus === 'PAYMENT_FAILED') {
        setShowConfirmModal(false);
        setPendingCancelError(null);
        setPendingOrderId(null);
        setPaymentFailedOrderId(orderId);
        return;
      }
      if (paymentStatus !== 'SUCCESS') {
        throw new Error('Cổng thanh toán trả về trạng thái không hợp lệ.');
      }

      // 3. Đối chiếu lại trạng thái đơn với backend trước khi báo thành công.
      const reconciledStatus = await fetchOrderStatusAfterPayment(orderId, token);
      if (reconciledStatus && reconciledStatus !== 'PAID') {
        throw new Error(
          `Đơn hàng chưa được ghi nhận PAID (trạng thái hiện tại: ${reconciledStatus}).`,
        );
      }

      setShowConfirmModal(false);
      setPendingCancelError(null);
      setPendingOrderId(null);
      if (retryOrder?.id !== orderId) clearCart();
      setRetryOrder(null);
      setSuccessOrderId(orderId);
      try {
        await loadProducts();
      } catch (refreshError) {
        console.error(
          'Thanh toán thành công nhưng không tải lại được tồn kho:',
          refreshError,
        );
        setProductsError(
          'Thanh toán thành công nhưng chưa cập nhật được tồn kho. Vui lòng tải lại trang.',
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (/stock|tồn kho|hết hàng|hết sản phẩm/i.test(message)) {
        setShowConfirmModal(false);
        setPendingOrderId(null);
        setRetryOrder(null);
        setOutOfStockMessage(message);
        try {
          await loadProducts();
        } catch (refreshError) {
          console.error("Không thể cập nhật tồn kho mới:", refreshError);
          setProductsError(
            "Không thể cập nhật tồn kho mới. Vui lòng tải lại trang.",
          );
        }
      } else alert(message || 'Đã xảy ra lỗi khi khởi tạo thanh toán.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const updateFailedOrder = async (action: 'retry-payment' | 'cancel') => {
    if (!paymentFailedOrderId) return;

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setPaymentFailedOrderId(null);
      setShowAuthModal(true);
      return;
    }

    setIsUpdatingFailedOrder(true);
    try {
      const response = await fetch(
        `http://localhost:3001/orders/${paymentFailedOrderId}/${action}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, 'Không thể cập nhật trạng thái đơn hàng'),
        );
      }

      if (action === 'retry-payment') {
        setPendingCancelError(null);
        setPendingOrderId(paymentFailedOrderId);
        setCheckoutModalKey((key) => key + 1);
        setPaymentFailedOrderId(null);
        setShowConfirmModal(true);
      } else {
        setPendingOrderId(null);
        setPaymentFailedOrderId(null);
        setRetryOrder(null);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Không thể cập nhật trạng thái đơn hàng.',
      );
    } finally {
      setIsUpdatingFailedOrder(false);
    }
  };

  const itemCount = hydrated ? totalItems() : 0;
  const subtotal = hydrated ? totalPrice() : 0;
  const cartList = hydrated ? items : [];
  const scrollToCart = () => {
  const el = document.getElementById("cart-sidebar");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  const handleCancelPendingOrder = async () => {
    if (!pendingOrderId) {
      setShowConfirmModal(false);
      setRetryOrder(null);
      return;
    }

    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      setPendingCancelError(
        `Chưa xác nhận hủy đơn ${pendingOrderId}: không tìm thấy phiên đăng nhập.`,
      );
      return;
    }

    cancellationInFlightRef.current = true;
    setIsCancellingOrder(true);
    setPendingCancelError(null);
    try {
      const response = await fetch(
        `http://localhost:3001/orders/${encodeURIComponent(pendingOrderId)}/cancel`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = getApiErrorMessage(
          data,
          `Backend từ chối yêu cầu (HTTP ${response.status}).`,
        );
        throw new Error(message);
      }
      if (getCancellationStatus(data) !== 'CANCELLED') {
        throw new Error('Backend chưa xác nhận trạng thái CANCELLED.');
      }

      window.sessionStorage.removeItem(EXIT_CANCEL_NOTICE_KEY);
      setPendingCancelError(null);
      setExitCancelNotice(`Backend đã xác nhận hủy đơn ${pendingOrderId}.`);
      setPendingOrderId(null);
      setRetryOrder(null);
      setShowConfirmModal(false);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Không nhận được phản hồi hợp lệ.';
      setPendingCancelError(
        `Chưa xác nhận hủy đơn ${pendingOrderId}. ${reason} Đơn có thể vẫn đang PENDING; hãy kiểm tra trạng thái trước khi tiếp tục.`,
      );
    } finally {
      cancellationInFlightRef.current = false;
      setIsCancellingOrder(false);
    }
  };

  useEffect(() => {
    if (!pendingOrderId || !showConfirmModal) return;

    const handlePageHide = () => {
      if (cancellationInFlightRef.current) return;

      const token = window.sessionStorage.getItem('accessToken');
      if (!token) return;

      cancellationInFlightRef.current = true;
      window.sessionStorage.setItem(EXIT_CANCEL_NOTICE_KEY, pendingOrderId);
      void fetch(
        `http://localhost:3001/orders/${encodeURIComponent(pendingOrderId)}/cancel`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        },
      )
        .then(async (response) => {
          if (!response.ok) return;
          const result: unknown = await response.json().catch(() => null);
          if (getCancellationStatus(result) === 'CANCELLED') {
            window.sessionStorage.removeItem(EXIT_CANCEL_NOTICE_KEY);
          }
        })
        .catch((error: unknown) => {
          console.error('Không thể gửi yêu cầu hủy khi rời trang:', error);
        });
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [pendingOrderId, showConfirmModal]);


  return (
    <div className="min-h-screen bg-[#f7f2eb] text-stone-900">
      {exitCancelNotice && (
        <p
          className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-lg"
          role="status"
        >
          {exitCancelNotice}
        </p>
      )}
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f7f2eb]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1b120d] text-[#f6d49a] shadow-sm">
              <Coffee size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                BrewLite
              </p>
              <h1 className="text-lg font-semibold text-stone-900">Coffee House</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToCart}
              className="flex items-center gap-2 rounded-full bg-[#1b120d] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#2a1b12]"
            >
              <ShoppingBag size={18} />
              <span>Giỏ hàng</span>
              {itemCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f6d49a] px-1 text-xs font-bold text-stone-900 animate-in fade-in zoom-in-75">
                  {itemCount}
                </span>
              )}
            </button>
            <UserNav
              currentUser={currentUser}
              onOpenAuthModal={() => setShowAuthModal(true)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section>
          <div className="bg-[#1d1917] p-6 text-white shadow-[0_20px_60px_rgba(26,22,17,0.18)] sm:p-8">
            <h2 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Đặt đồ uống
              <span className="block text-[#f6d49a]">theo phong cách của bạn</span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
              Khám phá các món cà phê, trà và thức uống đá xay được pha theo phong cách hiện đại,
              chuẩn vị và tiết kiệm thời gian ở mọi lúc trong ngày.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[2.2fr_0.8fr]">
          {/* Lưới sản phẩm */}
          <div className="min-h-[400px]">
            {/* 1. LOADING STATE */}
            {loading && (
              <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white text-stone-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#1d1917]" />
                <p className="text-sm font-medium">Đang tải thực đơn đồ uống...</p>
              </div>
            )}
            {productsError && (
              <p
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {productsError}
              </p>
            )}

            {/* 2. EMPTY STATE */}
            {!loading && products.length === 0 && (
              <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
                <Coffee className="h-10 w-10 text-stone-400" />
                <p className="text-base font-semibold text-stone-700">Chưa có món nào trong thực đơn</p>
                <p className="text-xs text-stone-500">Vui lòng kiểm tra lại kết nối backend hoặc nạp dữ liệu seed.</p>
              </div>
            )}

            {/* 3. DỮ LIỆU THỰC TẾ TỪ API */}
            {!loading && products.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className="group flex flex-col border border-stone-200 bg-white shadow-[0_16px_30px_rgba(17,12,12,0.04)]"
                  >
                    <Link href={`/products/${product.id}`} className="block overflow-hidden">
                      <div className="relative h-40 overflow-hidden bg-[#f7f2eb]">
                        <Image
                          src={getProductImageUrl(product.imageUrl)}
                          alt={`Minh họa ${product.name}`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover object-center drop-shadow-lg transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="mt-3 text-xl font-semibold text-stone-900 transition hover:text-amber-800">{product.name}</h3>
                      </Link>
                      <p className="mt-2 text-sm leading-6 text-stone-600">
                        Hương vị nguyên bản, chuẩn phong cách BrewLite.
                      </p>

                      <div className="mt-auto flex items-end justify-between pt-4">
                        <div>
                          <p className="text-[11px] tracking-[0.08em] text-stone-500">Giá</p>
                          <p className="text-2xl font-bold text-stone-900">{formatPrice(product.price)}</p>
                          <p className={`mt-1 text-xs ${product.stock > 0 ? "text-emerald-700" : "font-semibold text-red-600"}`}>
                            {product.stock > 0 ? `Còn ${product.stock}` : "Hết hàng"}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={product.stock <= 0}
                          aria-label={product.stock <= 0 ? `${product.name} hết hàng` : `Thêm ${product.name} vào giỏ`}
                          onClick={() =>
                            addItem({
                              productId: String(product.id),
                              name: product.name,
                              size: "M",
                              unitPrice: product.price,
                              quantity: 1,
                            })
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1d1917] text-white shadow-sm transition hover:bg-[#332d29] disabled:cursor-not-allowed disabled:bg-stone-300"
                        >
                          <Plus size={18} />
                        </button>

                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Giỏ hàng — dùng Zustand store thật */}
          <aside id="cart-sidebar" className="bg-[#1d1917] p-5 text-white shadow-[0_18px_50px_rgba(17,12,12,0.18)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Giỏ hàng</h3>
              <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-[#f6d49a]">
                {itemCount} món
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {cartList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-stone-300">
                  Giỏ hàng trống
                </div>
              ) : (
                cartList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="mt-1 text-sm text-stone-300">
                        Size {item.size}
                        {item.topping?.length ? ` • ${item.topping.join(", ")}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                      {/* Nút Giảm (-) */}
                      <button
                        type="button"
                        aria-label={`Giảm số lượng ${item.name}`}
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 select-none active:scale-95"
                      >
                        <Minus size={12} />
                      </button>

                      {/* Ô số ở giữa: vừa hiển thị, vừa click vào nhập số được ngay */}
                      <input
                        type="number"
                        min={1}
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val <= 0) {
                            updateQuantity(item.id, 0); // Cho phép xóa trắng để gõ số mới
                          } else {
                            updateQuantity(item.id, val);
                          }
                        }}
                        onBlur={() => {
                          // Khi click ra ngoài mà lỡ để trống hoặc 0 thì tự phục hồi về 1
                          if (!item.quantity || item.quantity < 1) {
                            updateQuantity(item.id, 1);
                          }
                        }}
                        className="w-10 rounded border border-white/20 bg-white/10 py-0.5 text-center text-sm font-semibold text-white outline-none focus:border-[#f6d49a] focus:ring-1 focus:ring-[#f6d49a] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      {/* Nút Tăng (+) */}
                      <button
                        type="button"
                        aria-label={`Tăng số lượng ${item.name}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 select-none active:scale-95"
                      >
                        <Plus size={12} />
                      </button>

                      {/* Nút Xóa */}
                      <button
                        type="button"
                        aria-label={`Xóa ${item.name}`}
                        onClick={() => removeItem(item.id)}
                        className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition hover:bg-white/10 hover:text-red-300"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    </div>
                    <p className="shrink-0 font-semibold text-[#f6d49a]">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-4 text-sm text-stone-300">
              <div className="flex items-center justify-between text-base font-semibold text-white">
                <span>Tổng cộng</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckoutClick}
              disabled={cartList.length === 0}
              className="mt-6 w-full rounded-full bg-[#f6d49a] px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-[#f3c56d] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Tiến hành thanh toán
            </button>
          </aside>
        </section>
      </main>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(token, user) => {
          clearCart();
          setCurrentUser(user);
        }}
      />
      <OrderSuccessModal
        orderId={successOrderId}
        onClose={() => setSuccessOrderId(null)}
      />
      <CheckoutConfirmModal
        key={checkoutModalKey}
        isOpen={showConfirmModal}
        onClose={handleCancelPendingOrder}
        onConfirm={handleConfirmOrder}
        items={retryOrder?.items ?? cartList}
        totalPrice={retryOrder?.total ?? subtotal}
        loading={isCheckingOut}
        cancelError={pendingCancelError}
        cancelling={isCancellingOrder}
      />
      <OutOfStockModal
        isOpen={outOfStockMessage !== null}
        message={outOfStockMessage ?? ''}
        onClose={() => setOutOfStockMessage(null)}
      />
      <PaymentFailedModal
        orderId={paymentFailedOrderId}
        loading={isUpdatingFailedOrder}
        onRetry={() => updateFailedOrder('retry-payment')}
        onCancel={() => updateFailedOrder('cancel')}
      />
    </div>
  );
}
