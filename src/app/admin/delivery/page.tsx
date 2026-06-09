"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, Search, MapPin, User,
  Bike, CheckCircle2, Clock,
  Navigation, Phone, MoreHorizontal,
  ChevronRight, Loader2, Package,
  AlertCircle, X, Check, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic';

const DeliveryTrackerMap = dynamic(() => import('@/components/DeliveryTrackerMap'), { 
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
});

interface Order {
  id: string;
  orderNumber: number;
  status: string;
  customerName: string;
  total: number;
  createdAt: string;
  deliveryOrder: {
    address: {
      addressLine: string;
      latitude: number;
      longitude: number;
    };
    rider?: {
      id: string;
      user: {
        name: string;
        phone: string;
      };
    };
  };
  items: any[];
}

interface Rider {
  id: string;
  user: {
    name: string;
  };
  isAvailable: boolean;
}

const statusColors: any = {
  PENDING: "bg-blue-50 text-blue-600 border-blue-100",
  ACCEPTED: "bg-green-50 text-green-600 border-green-100",
  PREPARING: "bg-orange-50 text-orange-600 border-orange-100",
  READY: "bg-purple-50 text-purple-600 border-purple-100",
  OUT_FOR_DELIVERY: "bg-yellow-50 text-yellow-600 border-yellow-100",
  DELIVERED: "bg-gray-50 text-gray-600 border-gray-100",
  CANCELLED: "bg-red-50 text-red-600 border-red-100",
};

const DELIVERY_FLOW = ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

const getNextStatus = (currentStatus: string) => {
  const currentIndex = DELIVERY_FLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === DELIVERY_FLOW.length - 1) return null;
  return DELIVERY_FLOW[currentIndex + 1];
};

export default function DeliveryManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [ordersRes, ridersRes] = await Promise.all([
        fetch("/api/admin/delivery"),
        fetch("/api/admin/riders")
      ]);
      const ordersData = await ordersRes.json();
      const ridersData = await ridersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setRiders(Array.isArray(ridersData) ? ridersData : []);
    } catch (e) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, status: string, riderId?: string) => {
    try {
      const res = await fetch("/api/admin/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status, riderId }),
      });
      if (res.ok) {
        toast.success(`Order ${status.toLowerCase().replace(/_/g, ' ')}`);
        fetchData();
        setShowAssignModal(false);
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toString().includes(searchQuery) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50/50 gap-0 lg:gap-6 overflow-hidden relative p-4 lg:p-8">
      <Toaster position="top-right" />
      
      {/* Left: Orders List */}
      <div className={cn(
        "w-full lg:w-[450px] flex flex-col gap-4 lg:gap-6 h-full",
        selectedOrder && "hidden lg:flex"
      )}>
        <div className="bg-white p-4 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Deliveries</h1>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search by order # or name..."
              className="w-full pl-12 pr-4 py-3 lg:py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all shadow-sm text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-black text-[10px] uppercase tracking-widest">Loading Live Data...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] lg:rounded-[2.5rem] border border-gray-100">
              <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-black text-gray-400 uppercase tracking-widest text-xs">No active deliveries</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <motion.button
                layout
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  "w-full text-left p-5 lg:p-6 rounded-[2rem] lg:rounded-[2.5rem] border transition-all relative group",
                  selectedOrder?.id === order.id 
                    ? "bg-white border-red-600 shadow-2xl shadow-red-900/10 lg:translate-x-2" 
                    : "bg-white border-gray-100 shadow-sm hover:border-gray-200"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</span>
                    <h3 className="text-lg lg:text-xl font-black text-gray-900 tracking-tight">#{order.orderNumber}</h3>
                  </div>
                  <div className={cn(
                    "px-3 py-1.5 rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest border",
                    statusColors[order.status]
                  )}>
                    {order.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-500">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="text-xs lg:text-sm font-bold truncate">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs lg:text-sm font-bold line-clamp-1">{order.deliveryOrder.address.addressLine}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <Bike className={cn("w-4 h-4 shrink-0", order.deliveryOrder.rider ? "text-blue-500" : "text-gray-300")} />
                    <span className="text-xs lg:text-sm font-bold truncate">
                      {order.deliveryOrder.rider?.user?.name || "No rider assigned"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-base lg:text-lg font-black text-red-600 tracking-tighter">
                    Rs. {order.total.toLocaleString()}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Right: Order Detail & Map */}
      <div className={cn(
        "flex-1 bg-white rounded-[2rem] lg:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full",
        !selectedOrder && "hidden lg:flex"
      )}>
        {selectedOrder ? (
          <>
            {/* Header */}
            <div className="p-4 lg:p-8 border-b border-gray-50 flex flex-col sm:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4 lg:gap-6">
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="lg:hidden p-2 bg-gray-50 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-600 rounded-2xl lg:rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-100">
                  <Package className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <div>
                  <h2 className="text-xl lg:text-3xl font-black text-gray-900 tracking-tight">Order #{selectedOrder.orderNumber}</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px] lg:text-xs flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-4 px-8 border-x border-gray-50 flex-1 max-w-2xl justify-center">
                <div className={cn(
                  "px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border shadow-sm flex items-center gap-3",
                  statusColors[selectedOrder.status]
                )}>
                  <div className="w-2 h-2 rounded-full animate-pulse bg-current" />
                  {selectedOrder.status.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="flex gap-2 lg:gap-3">
                {getNextStatus(selectedOrder.status) === "ACCEPTED" && (
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-3 bg-gray-900 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Bike className="w-4 h-4" />
                    <span className="hidden sm:inline">Assign Rider & Accept</span>
                    <span className="sm:hidden">Assign Rider</span>
                  </button>
                )}
                
                {getNextStatus(selectedOrder.status) && getNextStatus(selectedOrder.status) !== "ACCEPTED" && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                    className={cn(
                      "flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-3 text-white rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95",
                      selectedOrder.status === "ACCEPTED" ? "bg-orange-500 shadow-orange-100 hover:bg-orange-600" :
                      selectedOrder.status === "PREPARING" ? "bg-purple-500 shadow-purple-100 hover:bg-purple-600" :
                      selectedOrder.status === "READY" ? "bg-yellow-500 shadow-yellow-100 hover:bg-yellow-600" :
                      "bg-green-500 shadow-green-100 hover:bg-green-600"
                    )}
                  >
                    {selectedOrder.status === "ACCEPTED" ? "Start Preparing" :
                     selectedOrder.status === "PREPARING" ? "Mark Ready" :
                     selectedOrder.status === "READY" ? "Out for Delivery" :
                     "Mark Delivered"}
                  </button>
                )}

                {selectedOrder.status === "DELIVERED" && (
                  <div className="flex-1 sm:flex-none px-4 lg:px-6 py-2.5 lg:py-3 bg-green-50 text-green-600 rounded-xl lg:rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest border border-green-100 text-center">
                    Order Delivered
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Info Column */}
              <div className="w-full lg:w-[350px] p-4 lg:p-8 lg:border-r border-gray-50 overflow-y-auto no-scrollbar space-y-6 lg:space-y-8 shrink-0">
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Details</h4>
                  <div className="bg-gray-50 p-4 lg:p-6 rounded-2xl lg:rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-black text-gray-900 text-sm lg:text-base">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 leading-relaxed line-clamp-2">{selectedOrder.deliveryOrder.address.addressLine}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order Items</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black text-xs">{item.quantity}x</span>
                          <span className="text-xs lg:text-sm font-bold text-gray-800 truncate max-w-[120px] lg:max-w-none">{item.product?.name || item.name}</span>
                        </div>
                        <span className="text-[10px] lg:text-xs font-black text-gray-400 shrink-0">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Map Column */}
              <div className="flex-1 relative min-h-[300px] lg:min-h-0 border-t lg:border-t-0 border-gray-50">
                <div className="absolute inset-0">
                  <DeliveryTrackerMap 
                    customerLocation={{ 
                      lat: selectedOrder.deliveryOrder.address.latitude, 
                      lng: selectedOrder.deliveryOrder.address.longitude 
                    }}
                    cafeLocation={{ lat: 27.7172, lng: 85.3240 }}
                  />
                </div>
                {/* Floating Map Info */}
                <div className="absolute top-4 lg:top-6 left-4 lg:left-6 right-4 lg:right-6 z-10 flex gap-3 lg:gap-4">
                  <div className="bg-white/90 backdrop-blur-md px-4 lg:px-6 py-3 lg:py-4 rounded-2xl lg:rounded-3xl shadow-xl border border-white/20 flex-1">
                    <p className="text-[8px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Status</p>
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className={cn("w-2 h-2 lg:w-3 lg:h-3 rounded-full animate-pulse", selectedOrder.deliveryOrder.rider ? "bg-green-500" : "bg-gray-300")} />
                      <p className="font-black text-gray-900 text-xs lg:text-base truncate">{selectedOrder.deliveryOrder.rider?.user?.name || "Pending Assignment"}</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl lg:rounded-3xl shadow-xl border border-gray-800">
                    <p className="text-[8px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Distance</p>
                    <p className="text-lg lg:text-xl font-black tracking-tighter">3.2 KM</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 p-8 text-center">
            <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gray-50 rounded-[2.5rem] lg:rounded-[3rem] flex items-center justify-center mb-6">
              <Navigation className="w-12 h-12 lg:w-16 lg:h-16 opacity-20" />
            </div>
            <p className="font-black uppercase tracking-widest text-[10px] lg:text-xs">Select an order to view live tracking details</p>
          </div>
        )}
      </div>

      {/* Assign Rider Modal */}
      <AnimatePresence>
        {showAssignModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Assign Rider</h3>
                  <button onClick={() => setShowAssignModal(false)} className="p-2 bg-gray-50 rounded-xl">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto no-scrollbar pr-2">
                  {riders.filter(r => r.isAvailable).length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                      <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">No riders available right now</p>
                    </div>
                  ) : (
                    riders.filter(r => r.isAvailable).map(rider => (
                      <button
                        key={rider.id}
                        onClick={() => updateOrderStatus(selectedOrder.id, "ACCEPTED", rider.id)}
                        className="w-full flex items-center gap-4 p-5 rounded-3xl bg-gray-50 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all text-left group"
                      >
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Bike className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-gray-900 group-hover:text-red-600 transition-colors">{rider.user.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Now</p>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
