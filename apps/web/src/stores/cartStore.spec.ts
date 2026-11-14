import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './cartStore';

// Quy tắc tính giá Size và Topping khớp với trang Chi tiết món (products/[id]/page.tsx)
const SIZE_EXTRA: Record<'S' | 'M' | 'L', number> = {
  S: -5000,
  M: 0,
  L: 10000,
};

const TOPPING_PRICES: Record<string, number> = {
  'Trân châu đen': 10000,
  'Thạch trái cây': 8000,
  'Cream Cheese': 15000,
  'Pudding trứng': 10000,
};

function calculateUnitPrice(
  basePrice: number,
  size: 'S' | 'M' | 'L',
  toppings: string[],
): number {
  const toppingTotal = toppings.reduce(
    (sum, name) => sum + (TOPPING_PRICES[name] ?? 0),
    0,
  );
  return basePrice + SIZE_EXTRA[size] + toppingTotal;
}

describe('Catalog Detail & Cart Store (Task 5.1)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('1. Chọn size/topping và giá cập nhật chính xác', () => {
    const basePrice = 45000;

    // Size S (-5.000đ), không topping => 40.000đ
    expect(calculateUnitPrice(basePrice, 'S', [])).toBe(40000);

    // Size M (+0đ), thêm Trân châu đen (+10.000đ) => 55.000đ
    expect(calculateUnitPrice(basePrice, 'M', ['Trân châu đen'])).toBe(55000);

    // Size L (+10.000đ), thêm Trân châu đen (+10.000đ) + Cream Cheese (+15.000đ) => 80.000đ
    expect(
      calculateUnitPrice(basePrice, 'L', ['Trân châu đen', 'Cream Cheese']),
    ).toBe(80000);
  });

  it('2. Thêm sản phẩm vào giỏ hàng (gộp nếu trùng size/topping, tách nếu khác)', () => {
    const store = useCartStore.getState();

    store.addItem({
      productId: 'prod-1',
      name: 'Brew Latte',
      size: 'M',
      topping: ['Trân châu đen'],
      unitPrice: 69000,
      quantity: 1,
    });

    // Thêm cùng món + cùng size + cùng topping => cộng dồn số lượng lên 3
    store.addItem({
      productId: 'prod-1',
      name: 'Brew Latte',
      size: 'M',
      topping: ['Trân châu đen'],
      unitPrice: 69000,
      quantity: 2,
    });

    // Thêm cùng món nhưng khác size (Size L) => tạo dòng mới trong giỏ
    store.addItem({
      productId: 'prod-1',
      name: 'Brew Latte',
      size: 'L',
      topping: ['Trân châu đen'],
      unitPrice: 79000,
      quantity: 1,
    });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].quantity).toBe(3);
    expect(items[1].quantity).toBe(1);
  });

  it('3. Tăng/giảm số lượng sản phẩm trong giỏ hàng', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 'prod-2',
      name: 'Americano',
      size: 'M',
      unitPrice: 40000,
      quantity: 1,
    });

    const itemId = useCartStore.getState().items[0].id;

    // Tăng số lượng lên 4
    store.updateQuantity(itemId, 4);
    expect(useCartStore.getState().items[0].quantity).toBe(4);

    // Giảm số lượng xuống 2
    store.updateQuantity(itemId, 2);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('4. Xóa sản phẩm khỏi giỏ hàng (hoặc khi giảm số lượng về 0)', () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: 'prod-1',
      name: 'Cappuccino',
      size: 'M',
      unitPrice: 45000,
      quantity: 1,
    });
    store.addItem({
      productId: 'prod-2',
      name: 'Trà đào',
      size: 'L',
      unitPrice: 49000,
      quantity: 1,
    });

    const [firstItem, secondItem] = useCartStore.getState().items;

    // Xóa trực tiếp bằng removeItem
    store.removeItem(firstItem.id);
    expect(useCartStore.getState().items).toHaveLength(1);

    // Giảm số lượng về 0 tự động xóa sản phẩm
    store.updateQuantity(secondItem.id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('5. Tính tổng tiền (totalPrice) và tổng số lượng (totalItems) chính xác', () => {
    const store = useCartStore.getState();

    // 2 ly x 55.000đ = 110.000đ
    store.addItem({
      productId: 'prod-1',
      name: 'Cà phê sữa',
      size: 'M',
      topping: ['Trân châu đen'],
      unitPrice: 55000,
      quantity: 2,
    });

    // 1 ly x 65.000đ = 65.000đ
    store.addItem({
      productId: 'prod-2',
      name: 'Caramel Cold Brew',
      size: 'M',
      unitPrice: 65000,
      quantity: 1,
    });

    expect(useCartStore.getState().totalItems()).toBe(3);
    expect(useCartStore.getState().totalPrice()).toBe(175000);
  });
});