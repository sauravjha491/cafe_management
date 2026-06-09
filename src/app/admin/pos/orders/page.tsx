"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Filter, Calendar, 
  CreditCard, Banknote, QrCode, 
  Wallet, ChevronRight, Loader2,
  Receipt, RotateCcw, X, Check,
  User, Clock, Package, AlertCircle,
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";

export default function POSOrdersHistory() {
  const { role, user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/pos/history");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to fetch order history");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundReason) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pos/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          amount: selectedOrder.total,
          reason: refundReason,
          staffId: user?.uid || "admin"
        })
      });
      if (res.ok) {
        toast.success("Order refunded successfully");
        setShowRefundModal(false);
        setRefundReason("");
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (e) {
      toast.error("Failed to process refund");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Left List */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">POS History</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Order # or Customer..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-black text-[10px] uppercase tracking-widest">Loading History...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-gray-100">
              <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No orders found</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <motion.button
                layout
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  "w-full text-left p-6 rounded-[2.5rem] border transition-all relative group",
                  selectedOrder?.id === order.id 
                    ? "bg-white border-red-600 shadow-2xl shadow-red-900/10 translate-x-2" 
                    : "bg-white border-gray-100 shadow-sm hover:border-gray-200"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</span>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">#{order.orderNumber}</h3>
                  </div>
                  <div className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                    order.status === "REFUNDED" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                  )}>
                    {order.status}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-600">{order.customerName}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-lg font-black text-red-600 tracking-tighter">
                    Rs. {order.total.toLocaleString()}
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 bg-white rounded-[3rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedOrder ? (
          <>
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-gray-200">
                  <Receipt className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Details #{selectedOrder.orderNumber}</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                    Invoice: {selectedOrder.receiptNumber}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {(role === "OWNER" || role === "ADMIN") && selectedOrder.status !== "REFUNDED" && (
                  <button 
                    onClick={() => setShowRefundModal(true)}
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Refund
                  </button>
                )}
                <button className="p-3 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer</p>
                  <p className="font-black text-gray-900">{selectedOrder.customerName || "Walk-in"}</p>
                  <p className="text-xs font-bold text-gray-500">{selectedOrder.customerPhone || "No Phone"}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment</p>
                  <p className="font-black text-gray-900">{selectedOrder.paymentMethod}</p>
                  <p className="text-xs font-bold text-green-600 uppercase">{selectedOrder.paymentStatus}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cashier</p>
                  <p className="font-black text-gray-900">{selectedOrder.staff?.name || "System"}</p>
                  <p className="text-xs font-bold text-gray-500">ID: {selectedOrder.staffId}</p>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Items Summary</h4>
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Qty</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-6 py-4">
                            <p className="font-black text-gray-900 text-sm">{item.name}</p>
                            {item.note && <p className="text-[10px] text-red-500 italic">"{item.note}"</p>}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-gray-600 text-sm">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-bold text-gray-600 text-sm">Rs. {item.price.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right font-black text-gray-900 text-sm">Rs. {(item.quantity * item.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="flex justify-end">
                <div className="w-full max-w-xs space-y-3 bg-gray-900 p-8 rounded-[2.5rem] text-white">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>Subtotal</span>
                    <span>Rs. {selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                    <span>Tax ({selectedOrder.taxRate || 5}%)</span>
                    <span>Rs. {selectedOrder.tax.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-orange-400">
                      <span>Discount</span>
                      <span>-Rs. {selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                    <span className="text-sm font-black uppercase tracking-[0.2em]">Total</span>
                    <span className="text-2xl font-black text-red-500 tracking-tighter">Rs. {selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-200">
            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-6">
              <Receipt className="w-16 h-16 opacity-20" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs">Select an order to view full details</p>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      <AnimatePresence>
        {showRefundModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRefundModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <RotateCcw className="w-8 h-8 text-red-600" />
                  Process Refund
                </h3>
                <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">
                  Are you sure you want to refund order <span className="text-gray-900">#{selectedOrder.orderNumber}</span>? 
                  This will restore item stock and record a refund transaction.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Refund</label>
                    <textarea 
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all min-h-[120px]"
                      placeholder="e.g. Customer changed mind, Mistake in order..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowRefundModal(false)}
                      className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleRefund}
                      disabled={isProcessing || !refundReason}
                      className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Process Refund"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
