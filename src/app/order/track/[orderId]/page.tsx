"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  CheckCircle2, Clock, Coffee, Package, 
  Truck, User, ArrowLeft, Printer,
  Sparkles, Heart, UtensilsCrossed,
  ChefHat, Bell, Home, Navigation, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import dynamic from 'next/dynamic';

const DeliveryTrackerMap = dynamic(() => import('@/components/DeliveryTrackerMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-[2.5rem] flex items-center justify-center font-black text-gray-400 uppercase tracking-widest text-xs">Loading Live Map...</div>
});

const dineInStatuses = [
  { id: "PENDING", label: "Ordered", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", description: "Waiting for kitchen to accept...", particle: "🚀" },
  { id: "ACCEPTED", label: "Confirmed", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", description: "Kitchen has received your order!", particle: "✅" },
  { id: "PREPARING", label: "Cooking", icon: ChefHat, color: "text-orange-500", bg: "bg-orange-50", description: "Chef is preparing your meal...", particle: "🔥" },
  { id: "READY", label: "Ready", icon: Package, color: "text-purple-500", bg: "bg-purple-50", description: "Hot and fresh! Grab it at the counter.", particle: "📦" },
  { id: "SERVED", label: "Served", icon: UtensilsCrossed, color: "text-gray-500", bg: "bg-gray-50", description: "Enjoy your delicious meal!", particle: "🍴" },
];

const deliveryStatuses = [
  { id: "PENDING", label: "Ordered", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", description: "Waiting for confirmation...", particle: "🚀" },
  { id: "ACCEPTED", label: "Confirmed", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", description: "Order confirmed!", particle: "✅" },
  { id: "PREPARING", label: "Preparing", icon: ChefHat, color: "text-orange-500", bg: "bg-orange-50", description: "Chef is cooking your food...", particle: "🔥" },
  { id: "READY", label: "Ready", icon: Package, color: "text-purple-500", bg: "bg-purple-50", description: "Food is packed and ready!", particle: "📦" },
  { id: "OUT_FOR_DELIVERY", label: "On the way", icon: Truck, color: "text-yellow-600", bg: "bg-yellow-50", description: "Rider is heading to you!", particle: "🛵" },
  { id: "DELIVERED", label: "Delivered", icon: Home, color: "text-green-600", bg: "bg-green-50", description: "Enjoy your food!", particle: "🏠" },
];

const statuses = dineInStatuses; // Default fallback

function FloatingParticles() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const icons = ["☕", "🥐", "🍕", "🍔", "🍰", "🥤"];
    const newParticles = [...Array(20)].map(() => ({
      x: Math.random() * 100 + "%",
      xAnimate: (Math.random() * 100 - 50) + (Math.random() * 100) + "%",
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 20,
      icon: icons[Math.floor(Math.random() * icons.length)]
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            x: p.x, 
            y: "110%" 
          }}
          animate={{ 
            opacity: [0, 0.5, 0],
            y: "-10%",
            x: p.xAnimate
          }}
          transition={{ 
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
          className="absolute text-xl"
        >
          {p.icon}
        </motion.div>
      ))}
    </div>
  );
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const [settings, setSettings] = useState<any>({
    currency: "Rs.",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSettings(data);
      });
  }, []);

  const handleCallWaiter = async () => {
    if (!order || isCallingWaiter) return;
    
    setIsCallingWaiter(true);
    try {
      const res = await fetch("/api/waiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          customerName: order.customerName,
        }),
      });

      if (!res.ok) throw new Error("Failed to call waiter");

      toast.success("Waiter called! Someone will be with you shortly.", {
        icon: "🔔",
        style: {
          borderRadius: '1rem',
          background: '#333',
          color: '#fff',
        }
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to call waiter. Please try again.");
    } finally {
      setTimeout(() => setIsCallingWaiter(false), 5000); // Prevent spamming
    }
  };

  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders?id=${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setOrder(data);
          prevStatusRef.current = data.status;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (!db) return;

    const unsub = onSnapshot(doc(db, "orders", orderId as string), (docSnap) => {
      if (docSnap.exists()) {
        const firebaseData = docSnap.data();

        if (firebaseData.status === "READY" && prevStatusRef.current !== "READY") {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        }

        prevStatusRef.current = firebaseData.status;
        setOrder((prev: any) => ({ ...(prev || {}), ...firebaseData }));
      }
    }, (error) => {
      console.error("Order tracking listener error:", error);
    });

    return () => unsub();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div 
          animate={{ 
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-24 h-24 bg-red-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-red-200 relative">
            <Coffee className="text-white w-10 h-10" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-red-600 rounded-[2.5rem] -z-10"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-900 font-black text-xl tracking-tight">Brewing Status...</p>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Almost there</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!order) return null;

  const activeStatuses = order.type === "DELIVERY" ? deliveryStatuses : dineInStatuses;
  const currentStatusIndex = activeStatuses.findIndex((s) => s.id === order.status);
  const currentStatus = activeStatuses[currentStatusIndex] || activeStatuses[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden relative">
      <Toaster position="top-center" />
      <FloatingParticles />
      
      {/* Decorative Background Elements */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: "16rem" }}
        className="fixed top-0 left-0 w-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-b-[4rem] -z-10 shadow-2xl" 
      />
      
      {/* Confetti Placeholder */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <div className="text-6xl animate-bounce">🎉 READY! 🎉</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between text-white mb-8">
          <Link href="/order" className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/20 transition-all group">
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </Link>
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-black text-2xl tracking-tight leading-none"
            >
              Order Tracking
            </motion.h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-1.5">
              {order.type === "DELIVERY" ? "DELIVERY" : `TABLE ${order.tableNumber}`} • #{order.orderNumber}
            </p>
          </div>
          <button onClick={() => window.print()} className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/20 transition-all">
            <Printer className="w-6 h-6" />
          </button>
        </div>

        {/* Status Card (Hero) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden group"
        >
          {/* Animated Background Icon */}
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 0.95, 1]
            }}
            transition={{ repeat: Infinity, duration: 10 }}
            className="absolute -right-12 -top-12 opacity-[0.03] scale-[5] text-slate-900 pointer-events-none"
          >
            <currentStatus.icon className="w-24 h-24" />
          </motion.div>

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div 
              key={order.status}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("w-24 h-24 rounded-[3rem] flex items-center justify-center mb-6 shadow-xl relative", currentStatus.bg)}
            >
              <currentStatus.icon className={cn("w-12 h-12", currentStatus.color)} />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={cn("absolute inset-0 rounded-[3rem] -z-10", currentStatus.bg)}
              />
            </motion.div>
            
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter leading-none">{currentStatus.label}</h2>
            <p className="text-slate-500 font-bold max-w-[240px] leading-snug mt-2">{currentStatus.description}</p>
            
            <div className="mt-10 flex gap-3">
              <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ORDER NO</span>
                <span className="font-black text-slate-900">#{order.orderNumber}</span>
              </div>
              <div className="px-6 py-3 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Status</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Tracking Map for Delivery */}
        {order.type === "DELIVERY" && order.deliveryOrder?.address && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[3rem] p-4 shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shadow-sm">
                  <Navigation className="w-6 h-6 text-red-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Live Tracking</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Rider is heading your way</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">ETA</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">15-20 MIN</p>
              </div>
            </div>
            
            <div className="h-80 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner">
              <DeliveryTrackerMap 
                customerLocation={{ 
                  lat: order.deliveryOrder.address.latitude || 27.7172, 
                  lng: order.deliveryOrder.address.longitude || 85.3240 
                }}
                cafeLocation={{ lat: 27.7172, lng: 85.3240 }}
                riderLocation={order.riderLocation}
              />
            </div>

            <div className="p-6 flex items-center gap-5 bg-slate-50/50">
              <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                <User className="w-7 h-7 text-slate-300" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Rider</p>
                <p className="font-black text-slate-900 text-lg leading-none">{order.deliveryOrder.rider?.user?.name || "Locating Rider..."}</p>
              </div>
              {order.deliveryOrder.rider?.user?.phone && (
                <a 
                  href={`tel:${order.deliveryOrder.rider.user.phone}`}
                  className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-green-100 active:scale-95 transition-all"
                >
                  <Phone className="w-6 h-6" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Visual Progress Bar */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between relative px-2">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-50 -translate-y-1/2 rounded-full" />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(currentStatusIndex / (activeStatuses.length - 1)) * 100}%` }}
              className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-red-600 to-red-400 -translate-y-1/2 rounded-full z-10 transition-all duration-1000" 
            />

            {activeStatuses.map((s, i) => {
              const isPast = i < currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              return (
                <div key={s.id} className="relative z-20 flex flex-col items-center">
                  <motion.div 
                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      isPast ? "bg-red-600 text-white shadow-lg shadow-red-100" : 
                      isCurrent ? "bg-white border-4 border-red-600 text-red-600 scale-125 shadow-xl" : 
                      "bg-white border-2 border-gray-100 text-gray-300"
                    )}
                  >
                    <s.icon className={cn("w-6 h-6", isCurrent ? "animate-pulse" : "")} />
                  </motion.div>
                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-8 flex flex-col items-center whitespace-nowrap"
                      >
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">{s.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Accordion */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative"
        >
          {/* Receipt Decorator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-gray-50 rounded-full border border-gray-100" />
            ))}
          </div>

          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Digital Receipt</h3>
            <div className="bg-gray-900 text-white px-4 py-1.5 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-widest">{order.items?.length} Items</span>
            </div>
          </div>

          <div className="space-y-6">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start group">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-[1.5rem] flex items-center justify-center font-black text-gray-900 border border-gray-100 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                    {item.quantity}x
                  </div>
                  <div className="pt-1">
                    <p className="font-black text-gray-800 leading-tight text-lg">{item.product?.name || item.name}</p>
                    {item.note && (
                      <div className="flex items-center gap-1.5 mt-1.5 bg-red-50 px-3 py-1 rounded-full w-fit">
                        <Sparkles className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] text-red-600 font-bold italic">&quot;{item.note}&quot;</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="font-black text-gray-900 tracking-tighter text-lg pt-1">{settings.currency} {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t-4 border-dotted border-gray-50 space-y-4">
            <div className="flex justify-between text-sm text-gray-400 font-black uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-gray-900">{settings.currency} {(order.total / 1.07).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400 font-black uppercase tracking-widest">
              <span>Tax & Svc (7%)</span>
              <span className="text-gray-900">{settings.currency} {(order.total - (order.total / 1.07)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Total Amount</span>
                <span className="text-3xl font-black text-red-600 tracking-tighter">{settings.currency} {order.total?.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                  order.paymentStatus === "PAID" ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                )}>
                  {order.paymentStatus === "PAID" ? `Paid via ${order.paymentMethod || "Cash"}` : "Pay at counter"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Support */}
        <div className="grid grid-cols-2 gap-4">
          {order.type === "TABLE" && (
            <button 
              onClick={handleCallWaiter}
              disabled={isCallingWaiter}
              className={cn(
                "bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:bg-gray-50 transition-all active:scale-95 group",
                isCallingWaiter ? "opacity-50 cursor-not-allowed" : ""
              )}
            >
              <div className={cn(
                "w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform",
                isCallingWaiter ? "animate-pulse" : ""
              )}>
                <Bell className="w-6 h-6 text-red-600" />
              </div>
              <span className="font-black text-xs text-gray-900 uppercase tracking-widest">
                {isCallingWaiter ? "Calling..." : "Call Waiter"}
              </span>
            </button>
          )}
          <Link 
            href={order.type === "DELIVERY" ? "/delivery" : "/order"}
            className={cn(
              "bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:bg-gray-50 transition-all active:scale-95 group",
              order.type === "DELIVERY" ? "col-span-2" : ""
            )}
          >
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <span className="font-black text-xs text-gray-900 uppercase tracking-widest">
              {order.type === "DELIVERY" ? "Order More" : "Favorites"}
            </span>
          </Link>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Thank you for dining with us</p>
        </div>
      </div>
    </div>
  );
}
