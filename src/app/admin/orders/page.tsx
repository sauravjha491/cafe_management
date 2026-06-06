"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { 
  CheckCircle2, Clock, Coffee, Package, Truck, 
  MoreVertical, Check, X, AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", btn: "Accept" },
  ACCEPTED: { label: "Accepted", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", btn: "Prepare" },
  PREPARING: { label: "Preparing", icon: Coffee, color: "text-orange-600", bg: "bg-orange-50", btn: "Ready" },
  READY: { label: "Ready", icon: Package, color: "text-purple-600", bg: "bg-purple-50", btn: "Serve" },
  SERVED: { label: "Served", icon: Truck, color: "text-gray-600", bg: "bg-gray-50", btn: "Done" },
};

const nextStatus = {
  PENDING: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch from API
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });

    // Real-time listener for new orders and status updates
    const q = query(collection(db, "orders"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          // Instead of fetching all, we could update single item, 
          // but for now, re-fetching is safer to get full Prisma data.
          // We use a small delay to ensure SQLite has finished its transaction.
          setTimeout(() => {
            fetch("/api/orders")
              .then((res) => res.json())
              .then((data) => setOrders(data));
          }, 500);
        }
      });
    });

    return () => unsub();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    // Optimistic Update
    const previousOrders = [...orders];
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));

    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      
      if (res.ok) {
        toast.success(`Order marked as ${status.toLowerCase()}`);
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      // Revert if failed
      setOrders(previousOrders);
      toast.error("Failed to update status. Check Firebase permissions.");
    }
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Live Orders</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">Manage and track incoming orders in real-time</p>
        </div>
        <div className="flex gap-4 self-start md:self-auto">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs md:text-sm font-bold text-gray-600">Live Feed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence>
          {orders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const next = nextStatus[order.status as keyof typeof nextStatus];

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={order.id}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className={cn("p-4 flex justify-between items-center border-b", config.bg)}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg">#{order.orderNumber}</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", config.color, "bg-white/50")}>
                      {config.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Table</p>
                    <p className="font-black text-gray-900">{order.tableNumber}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="font-bold text-gray-800">{order.customerName}</span>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-2">
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold h-fit">
                              {item.quantity}x
                            </span>
                            <span className="text-gray-700 font-medium leading-tight">{item.product.name}</span>
                          </div>
                          {item.note && (
                            <span className="text-[10px] text-red-500 font-bold italic ml-8 leading-tight">
                              "{item.note}"
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50 border-t flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase">Total Amount</span>
                    <span className="font-black text-gray-900">${order.total.toFixed(2)}</span>
                  </div>
                  
                  {next ? (
                    <button
                      onClick={() => updateStatus(order.id, next)}
                      className={cn(
                        "w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                        next === "ACCEPTED" ? "bg-blue-600 shadow-blue-100" :
                        next === "PREPARING" ? "bg-green-600 shadow-green-100" :
                        next === "READY" ? "bg-orange-600 shadow-orange-100" :
                        "bg-purple-600 shadow-purple-100"
                      )}
                    >
                      {statusConfig[next as keyof typeof statusConfig].btn} Order
                      <Check className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="py-3 text-center text-gray-400 font-bold text-sm bg-gray-100 rounded-2xl">
                      Order Completed
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
