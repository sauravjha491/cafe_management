import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  note?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: any, note?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, note) => {
        const existingItem = get().items.find((item) => item.id === product.id);
        if (existingItem) {
          set({
            items: get().items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1, note: note || item.note }
                : item
            ),
          });
        } else {
          set({
            items: [...get().items, { ...product, quantity: 1, note }],
          });
        }
      },
      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id),
        });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
