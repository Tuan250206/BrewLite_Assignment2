import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartSize = "S" | "M" | "L";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  size: CartSize;
  topping?: string[] | null;
  quantity: number;
  unitPrice: number;
}

export interface AddCartItemInput {
  productId: string;
  name: string;
  size: CartSize;
  topping?: string[] | null;
  quantity?: number;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: AddCartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

function buildCartItemId(
  productId: string,
  size: CartSize,
  topping?: string[] | null,
): string {
  const toppingKey = topping?.length
    ? JSON.stringify([...topping].sort())
    : "none";

  return `${productId}-${size}-${toppingKey}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = buildCartItemId(item.productId, item.size, item.topping);
        const quantityToAdd = item.quantity ?? 1;
        const existing = get().items.find((cartItem) => cartItem.id === id);

        if (existing) {
          set({
            items: get().items.map((cartItem) =>
              cartItem.id === id
                ? { ...cartItem, quantity: cartItem.quantity + quantityToAdd }
                : cartItem,
            ),
          });
          return;
        }

        set({
          items: [
            ...get().items,
            {
              id,
              productId: item.productId,
              name: item.name,
              size: item.size,
              topping: item.topping ?? null,
              quantity: quantityToAdd,
              unitPrice: item.unitPrice,
            },
          ],
        });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((cartItem) => cartItem.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set({
          items: get().items.map((cartItem) =>
            cartItem.id === id ? { ...cartItem, quantity } : cartItem,
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      totalItems: () =>
        get().items.reduce((sum, cartItem) => sum + cartItem.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, cartItem) => sum + cartItem.unitPrice * cartItem.quantity,
          0,
        ),
    }),
    {
      name: "brewlite-cart",
    },
  ),
);
