"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, MessageCircle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { LandingShell, useSiteSettings } from "@/components/LandingShell";

export default function ContactPage() {
  const { settings, loading } = useSiteSettings();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-4">Get in Touch</p>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">Contact Us</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Have a question, feedback, or want to book a table? We would love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {[
              { icon: MapPin, label: "Address", value: settings.address },
              { icon: Phone, label: "Phone", value: settings.phone, href: `tel:${settings.phone}` },
              { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
              { icon: Clock, label: "Weekdays", value: settings.workingHoursWeekdays },
              { icon: Clock, label: "Weekends", value: settings.workingHoursWeekend },
            ].map((item) => (
              <div key={item.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="font-bold text-slate-900 hover:text-red-600 transition-colors">{item.value}</a>
                  ) : (
                    <p className="font-bold text-slate-900">{item.value}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="bg-red-600 p-8 rounded-[2rem] text-white">
              <h3 className="text-xl font-black mb-2">Ready to order?</h3>
              <p className="text-white/80 font-medium mb-6">Scan your table QR or browse our menu online.</p>
              <button
                onClick={() => router.push("/order?table=0")}
                className="bg-white text-red-600 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 transition-colors"
              >
                Browse Menu <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-slate-100"
          >
            {submitted ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Message Sent!</h2>
                <p className="text-slate-500 font-medium mb-6">Thank you for reaching out. We will get back to you soon.</p>
                <Link href="/" className="text-red-600 font-black text-sm uppercase tracking-widest hover:underline">Back to Home</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Send a Message</h2>
                <p className="text-slate-500 text-sm font-medium mb-6">Or email us directly at {settings.email}</p>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none font-bold"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none font-bold"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    required
                    rows={5}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/10 outline-none font-bold resize-none"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                >
                  Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </LandingShell>
  );
}
