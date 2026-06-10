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
    <div className="flex flex-col lg:flex-row h-full min-w-0 bg-slate-50/50 gap-0 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Left List */}
      <div className="w-full lg:w-[400px] flex flex-col bg-white border-r border-slate-100 shrink-0">
        <div className="p-6 lg:p-8 space-y-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">POS History</h1>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
            <input 
              type="text"
              placeholder="Order # or Customer..."
              className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 outline-none font-bold transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-8 space-y-4 pb-20">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-slate-300">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-black text-[10px] uppercase tracking-widest">Loading History...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center">
              <AlertCircle className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No orders found</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <motion.button
                layout
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  "w-full text-left p-6 rounded-2xl border transition-all relative group",
                  selectedOrder?.id === order.id 
                    ? "bg-white border-red-600 shadow-xl shadow-red-900/5" 
                    : "bg-white border-slate-100 shadow-sm hover:border-slate-200"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">#{order.orderNumber}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                    order.status === "REFUNDED" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                  )}>
                    {order.status}
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-sm font-bold text-slate-600 truncate mr-4">{order.customerName || "Walk-in"}</p>
                  <p className="text-lg font-black text-red-600 tracking-tighter shrink-0">
                    Rs.{order.total.toLocaleString()}
                  </p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {selectedOrder ? (
          <>
            <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-6 min-w-0">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <Receipt className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight truncate">Order #{selectedOrder.orderNumber}</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-1">
                    Invoice: {selectedOrder.receiptNumber}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {(role === "OWNER" || role === "ADMIN") && selectedOrder.status !== "REFUNDED" && (
                  <button 
                    onClick={() => setShowRefundModal(true)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                    title="Refund Order"
                  >
                    <RotateCcw className="w-5 h-5 group-active:rotate-[-45deg] transition-transform" />
                  </button>
                )}
                <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm">
                  <Printer className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="lg:hidden p-3 bg-slate-50 text-slate-400 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 space-y-10">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Customer</p>
                  <p className="font-black text-slate-900 text-lg">{selectedOrder.customerName || "Walk-in Customer"}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{selectedOrder.customerPhone || "No contact provided"}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment Info</p>
                  <p className="font-black text-slate-900 text-lg">{selectedOrder.paymentMethod}</p>
                  <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 rounded text-[8px] font-black uppercase tracking-widest mt-1">
                    {selectedOrder.paymentStatus}
                  </span>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Staff / ID</p>
                  <p className="font-black text-slate-900 text-lg">{selectedOrder.staff?.name || "System Administrator"}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">ID: {selectedOrder.staffId}</p>
                </div>
              </section>

              <section>
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Ordered Items</h4>
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse responsive-table">
                        <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Price</th>
                            <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {selectedOrder.items.map((item: any, idx: number) => (
                            <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                            <td className="px-8 py-6" data-label="Product">
                                <p className="font-black text-slate-900 text-base">{item.name}</p>
                                {item.note && <p className="text-[10px] text-red-500 font-bold italic mt-1">&quot;{item.note}&quot;</p>}
                            </td>
                            <td className="px-8 py-6 text-center font-bold text-slate-600" data-label="Qty">{item.quantity}</td>
                            <td className="px-8 py-6 text-right font-bold text-slate-600" data-label="Price">Rs.{item.price.toLocaleString()}</td>
                            <td className="px-8 py-6 text-right font-black text-slate-900" data-label="Total">Rs.{(item.quantity * item.price).toLocaleString()}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="flex justify-end pb-12">
                <div className="w-full max-w-sm space-y-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50">
                    <span>Subtotal</span>
                    <span className="font-mono text-white">Rs.{selectedOrder.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-50">
                    <span>Tax ({selectedOrder.taxRate || 5}%)</span>
                    <span className="font-mono text-white">Rs.{selectedOrder.tax.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-orange-400">
                      <span>Applied Discount</span>
                      <span className="font-mono">-Rs.{selectedOrder.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <span className="text-sm font-black uppercase tracking-[0.3em] opacity-50">Grand Total</span>
                    <span className="text-4xl font-black text-red-500 tracking-tighter">Rs.{selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-200 p-10">
            <div className="w-40 h-40 bg-white rounded-[3rem] flex items-center justify-center mb-8 shadow-inner border border-slate-50">
              <Receipt className="w-20 h-20 opacity-[0.05]" />
            </div>
            <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Select an order from the left to view history</p>
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
