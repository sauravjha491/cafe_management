"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowRight, Utensils, 
  MapPin, Sparkles, Smartphone, Zap, Clock, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LandingFooter, LandingNav, useSiteSettings } from "@/components/LandingShell";

export default function Home() {
  const router = useRouter();
  const { settings, loading } = useSiteSettings();
  const [tableNumber, setTableNumber] = useState("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "DELIVERY">("DINE_IN");

  const handleStartOrdering = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber) {
      router.push(`/order?table=${tableNumber}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-red-100 selection:text-red-600">
      <div className="relative flex-1 flex flex-col">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-red-100/30 rounded-full blur-[120px] opacity-50" />
          <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-orange-100/30 rounded-full blur-[100px] opacity-50" />
        </div>

        <LandingNav settings={settings} />

        <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col lg:flex-row items-center gap-16 py-12 lg:py-24">
          <div className="flex-1 space-y-10 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-full shadow-sm text-red-600 font-black text-[10px] uppercase tracking-[0.2em]"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              {settings.heroTagline}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter"
            >
              Scan. Order. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">Enjoy.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed"
            >
              Welcome to <span className="text-slate-900 font-black">{settings.cafeName}</span>. Skip the queue and experience the most seamless way to enjoy your favorite treats.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50 max-w-md mx-auto lg:mx-0"
            >
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setOrderType("DINE_IN")}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    orderType === "DINE_IN" ? "bg-red-600 text-white shadow-xl shadow-red-200" : "bg-slate-50 text-slate-400"
                  )}
                >
                  <Utensils className="w-4 h-4" />
                  Dine-in
                </button>
                <button 
                  onClick={() => setOrderType("DELIVERY")}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    orderType === "DELIVERY" ? "bg-red-600 text-white shadow-xl shadow-red-200" : "bg-slate-50 text-slate-400"
                  )}
                >
                  <MapPin className="w-4 h-4" />
                  Delivery
                </button>
              </div>

              {orderType === "DINE_IN" ? (
                <form onSubmit={handleStartOrdering} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Where are you sitting?</label>
                    <input 
                      required
                      type="number"
                      placeholder="Enter Table Number"
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-8 focus:ring-red-500/5 font-black text-3xl text-center placeholder:text-slate-200 placeholder:text-xl transition-all"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 font-bold text-center">Or scan the QR code on your table</p>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                    Start My Order
                    <ArrowRight className="w-6 h-6" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => router.push('/order?table=0')}
                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-red-600 transition-colors"
                  >
                    Just browse the menu
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <p className="text-slate-500 text-center font-medium px-4 leading-relaxed">
                    Craving something delicious? We&apos;ll bring it right to your doorstep.
                  </p>
                  <button 
                    onClick={() => router.push("/delivery")}
                    className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-4 active:scale-95"
                  >
                    Order Delivery
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex-1 relative hidden lg:block"
          >
            <div className="relative z-10 w-[450px] h-[600px] bg-gray-200 rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white rotate-3">
              <img 
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80" 
                alt="Cafe Interior"
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-12 top-1/4 z-20 bg-white p-6 rounded-[2rem] shadow-2xl border border-gray-100 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-black text-gray-900">Freshly Brewed</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prepared in 5-10 mins</p>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em]">How it works</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">The Modern Dining Way</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, title: "Scan & Browse", desc: "No apps required. Scan the table QR or enter your table number to browse our digital menu." },
              { icon: Zap, title: "Instant Order", desc: "Your order goes straight to our kitchen screen. No more waiting for staff to take notes." },
              { icon: Clock, title: "Live Tracking", desc: "Watch your meal status change from preparing to ready in real-time on your phone." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 bg-[#fafafa] rounded-[3rem] space-y-6 hover:bg-white hover:shadow-2xl hover:shadow-gray-200 transition-all group"
              >
                <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-300 bg-red-50 text-red-600")}>
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{f.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-4">About Us</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">{settings.cafeName}</h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">{settings.aboutText}</p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-red-600 font-black text-sm uppercase tracking-widest hover:underline"
          >
            Learn More <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <LandingFooter settings={settings} />
    </div>
  );
}
