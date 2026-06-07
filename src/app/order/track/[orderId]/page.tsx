"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  CheckCircle2, Clock, Coffee, Package, 
  Truck, User, ArrowLeft, Printer,
  Sparkles, Heart, UtensilsCrossed,
  ChefHat, Bell, Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

const statuses = [
  { id: "PENDING", label: "Ordered", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", description: "Waiting for kitchen to accept...", particle: "🚀" },
  { id: "ACCEPTED", label: "Confirmed", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", description: "Kitchen has received your order!", particle: "✅" },
  { id: "PREPARING", label: "Cooking", icon: ChefHat, color: "text-orange-500", bg: "bg-orange-50", description: "Chef is preparing your meal...", particle: "🔥" },
  { id: "READY", label: "Ready", icon: Package, color: "text-purple-500", bg: "bg-purple-50", description: "Hot and fresh! Grab it at the counter.", particle: "📦" },
  { id: "SERVED", label: "Served", icon: UtensilsCrossed, color: "text-gray-500", bg: "bg-gray-50", description: "Enjoy your delicious meal!", particle: "🍴" },
];

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

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders?id=${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      });

    if (!db) return;

    const unsub = onSnapshot(doc(db, "orders", orderId as string), (doc) => {
      if (doc.exists()) {
        const firebaseData = doc.data();
        
        // Show confetti when status becomes READY
        if (firebaseData.status === "READY" && order?.status !== "READY") {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          const audio = new Audio("/notification.mp3");
          audio.play().catch(() => {});
        }

        setOrder((prev: any) => ({ ...prev, ...firebaseData }));
      }
    });

    return () => unsub();
  }, [orderId, order?.status]);

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

  const currentStatusIndex = statuses.findIndex((s) => s.id === order.status);
  const currentStatus = statuses[currentStatusIndex] || statuses[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-x-hidden relative">
      <Toaster position="top-center" />
      <FloatingParticles />
      
      {/* Decorative Background Elements */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: "16rem" }}
        className="fixed top-0 left-0 w-full bg-gradient-to-b from-red-600 to-red-700 rounded-b-[4rem] -z-10" 
      />
      
      {/* Confetti Placeholder (if you want to add actual confetti lib later) */}
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
          <Link href="/order" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all group">
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </Link>
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-black text-2xl tracking-tight"
            >
              Order Tracking
            </motion.h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Table {order.tableNumber} • #{order.orderNumber}</p>
          </div>
          <button onClick={() => window.print()} className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all">
            <Printer className="w-6 h-6" />
          </button>
        </div>

        {/* Status Card (Hero) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-red-900/10 border border-gray-100 relative overflow-hidden group"
        >
          {/* Animated Background Icon */}
          <motion.div 
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 0.95, 1]
            }}
            transition={{ repeat: Infinity, duration: 10 }}
            className="absolute -right-12 -top-12 opacity-[0.04] scale-[5] text-red-600 pointer-events-none"
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
            
            <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{currentStatus.label}</h2>
            <p className="text-gray-500 font-bold max-w-[240px] leading-snug">{currentStatus.description}</p>
            
            <div className="mt-8 flex gap-3">
              <div className="px-5 py-2.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</span>
                <span className="font-black text-gray-900">#{order.orderNumber}</span>
              </div>
              <div className="px-5 py-2.5 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Visual Progress Bar */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between relative px-2">
            {/* Connector Line */}
            <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-50 -translate-y-1/2 rounded-full" />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
              className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-red-600 to-red-400 -translate-y-1/2 rounded-full z-10 transition-all duration-1000" 
            />

            {statuses.map((s, i) => {
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
                    <p className="font-black text-gray-800 leading-tight text-lg">{item.product.name}</p>
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
                <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">Paid via QR</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Support */}
        <div className="grid grid-cols-2 gap-4">
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
          <Link 
            href="/order?table=1&category=favorites"
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center gap-3 hover:bg-gray-50 transition-all active:scale-95 group"
          >
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <span className="font-black text-xs text-gray-900 uppercase tracking-widest">Favorites</span>
          </Link>
        </div>

        <div className="text-center pt-4">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Thank you for dining with us</p>
        </div>
      </div>
    </div>
  );
}
