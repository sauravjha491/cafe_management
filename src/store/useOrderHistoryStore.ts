import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrderHistoryState {
  orderIds: string[];
  addOrderId: (id: string) => void;
}

export const useOrderHistoryStore = create<OrderHistoryState>()(
  persist(
    (set, get) => ({
      orderIds: [],
      addOrderId: (id) => {
        const current = get().orderIds;
        if (!current.includes(id)) {
          set({ orderIds: [id, ...current].slice(0, 10) }); // Keep last 10 orders
        }
      },
    }),
    {
      name: "order-history-storage",
    }
  )
);
