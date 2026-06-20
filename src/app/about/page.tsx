"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Coffee, Users, Zap, Heart, Loader2, ArrowRight } from "lucide-react";
import { LandingShell, useSiteSettings } from "@/components/LandingShell";

export default function AboutPage() {
  const { settings, loading } = useSiteSettings();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <LandingShell settings={settings}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Our Story</p>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">About {settings.cafeName}</h1>
          <p className="text-lg text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
            {settings.aboutText}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Coffee, title: "Quality First", desc: "Every cup and plate is crafted with premium ingredients and care." },
            { icon: Zap, title: "Tech-Powered", desc: "Order from your table, track in real-time, and skip the wait." },
            { icon: Heart, title: "Customer Love", desc: "Your experience matters — from scan to serve, we make it seamless." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                <item.icon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-500 font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[3rem] p-12 md:p-16 text-center text-white"
        >
          <Users className="w-12 h-12 mx-auto mb-6 text-red-400" />
          <h2 className="text-3xl font-black mb-4">Visit Us Today</h2>
          <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto">
            Scan the QR code on your table to order, or browse our menu and start your experience.
          </p>
          <button
            onClick={() => router.push("/order?table=0")}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black inline-flex items-center gap-3 hover:bg-red-700 transition-all active:scale-95"
          >
            View Menu <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </LandingShell>
  );
}
