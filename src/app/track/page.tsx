"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { LandingShell, useSiteSettings } from "@/components/LandingShell";

export default function TrackPage() {
  const { settings, loading } = useSiteSettings();
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setSearching(true);
    setError("");

    try {
      const res = await fetch(`/api/orders?id=${orderId.trim()}`);
      const data = await res.json();

      if (res.ok && data && !data.error && data.id) {
        router.push(`/order/track/${data.id}`);
      } else {
        setError("Order not found. Please check your order ID and try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
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
    <LandingShell settings={settings}>
      <div className="max-w-xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Live Updates</p>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Track Your Order</h1>
          <p className="text-slate-500 font-medium">
            Enter your order ID from the confirmation screen to see real-time status updates.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleTrack}
          className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-6"
        >
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Order ID</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                required
                type="text"
                placeholder="Paste your order ID here"
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-red-500/5 outline-none font-bold"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={searching}
            className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Track Order <ArrowRight className="w-5 h-5" /></>}
          </button>
        </motion.form>
      </div>
    </LandingShell>
  );
}
