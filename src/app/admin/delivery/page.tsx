"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Search, MapPin, User, 
  Bike, CheckCircle2, Clock, 
  Navigation, Phone, MoreHorizontal,
  ChevronRight, Loader2, Package,
  AlertCircle, X, Check
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
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Left: Orders List */}
      <div className="w-[450px] flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Deliveries</h1>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search by order # or name..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all shadow-sm"
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
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100">
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
                    statusColors[order.status]
                  )}>
                    {order.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-500">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-bold">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold line-clamp-1">{order.deliveryOrder.address.addressLine}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <Bike className={cn("w-4 h-4", order.deliveryOrder.rider ? "text-blue-500" : "text-gray-300")} />
                    <span className="text-sm font-bold">
                      {order.deliveryOrder.rider?.user?.name || "No rider assigned"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-lg font-black text-red-600 tracking-tighter">
                    Rs. {order.total.toLocaleString()}
                  </span>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Right: Order Detail & Map */}
      <div className="flex-1 bg-white rounded-[3rem] shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selectedOrder ? (
          <>
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-red-100">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order #{selectedOrder.orderNumber}</h2>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {selectedOrder.status === "PENDING" && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, "ACCEPTED")}
                    className="px-6 py-3 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-600 transition-all active:scale-95"
                  >
                    Accept Order
                  </button>
                )}
                {!selectedOrder.deliveryOrder.rider && (
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Bike className="w-4 h-4" />
                    Assign Rider
                  </button>
                )}
                {selectedOrder.status === "READY" && (
                  <button 
                    onClick={() => updateOrderStatus(selectedOrder.id, "OUT_FOR_DELIVERY")}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-100 hover:bg-yellow-600 transition-all active:scale-95"
                  >
                    Out for Delivery
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Info Column */}
              <div className="w-[350px] p-8 border-r border-gray-50 overflow-y-auto no-scrollbar space-y-8">
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Details</h4>
                  <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-black text-gray-900">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 leading-relaxed">{selectedOrder.deliveryOrder.address.addressLine}</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Order Items</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center font-black text-xs">{item.quantity}x</span>
                          <span className="text-sm font-bold text-gray-800">{item.product?.name || item.name}</span>
                        </div>
                        <span className="text-xs font-black text-gray-400">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Map Column */}
              <div className="flex-1 relative">
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
                <div className="absolute top-6 left-6 right-6 z-10 flex gap-4">
                  <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl border border-white/20 flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rider Status</p>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full animate-pulse", selectedOrder.deliveryOrder.rider ? "bg-green-500" : "bg-gray-300")} />
                      <p className="font-black text-gray-900">{selectedOrder.deliveryOrder.rider?.user?.name || "Pending Assignment"}</p>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-white px-8 py-4 rounded-3xl shadow-xl border border-gray-800">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Distance</p>
                    <p className="text-xl font-black tracking-tighter">3.2 KM</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-6">
              <Navigation className="w-16 h-16 opacity-20" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs">Select an order to view details</p>
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
