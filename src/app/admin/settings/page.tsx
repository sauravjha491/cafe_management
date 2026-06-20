"use client";

import { useEffect, useState } from "react";
import { 
  Settings as SettingsIcon, Store, DollarSign, 
  Percent, MapPin, Phone, Save, Loader2, Globe,
  Clock, Share2, FileText, Mail
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    cafeName: "CafePro",
    currency: "Rs.",
    taxRate: 5.0,
    serviceCharge: 2.0,
    address: "",
    phone: "",
    email: "",
    heroTagline: "",
    aboutText: "",
    footerText: "",
    workingHoursWeekdays: "08:00 - 22:00",
    workingHoursWeekend: "09:00 - 23:00",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    websiteUrl: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          cafeName: data.cafeName || "CafePro",
          currency: data.currency || "Rs.",
          taxRate: data.taxRate ?? 5.0,
          serviceCharge: data.serviceCharge ?? 2.0,
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          heroTagline: data.heroTagline || "New Generation of Dining",
          aboutText: data.aboutText || "",
          footerText: data.footerText || "",
          workingHoursWeekdays: data.workingHoursWeekdays || "08:00 - 22:00",
          workingHoursWeekend: data.workingHoursWeekend || "09:00 - 23:00",
          facebookUrl: data.facebookUrl || "",
          instagramUrl: data.instagramUrl || "",
          twitterUrl: data.twitterUrl || "",
          websiteUrl: data.websiteUrl || "",
        });
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          taxRate: parseFloat(formData.taxRate.toString()),
          serviceCharge: parseFloat(formData.serviceCharge.toString()),
        }),
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-slate-50/50">
      <div className="p-4 lg:p-8 shrink-0 bg-white border-b border-slate-100 lg:bg-transparent lg:border-0">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Dashboard Settings</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">Manage café profile, landing page content, and checkout preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:px-8 pb-20">
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-red-50 p-2.5 rounded-xl">
                <Store className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Café Profile</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Café Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  value={formData.cafeName}
                  onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Store Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-purple-50 p-2.5 rounded-xl">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Landing Page Content</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Tagline</label>
                <input
                  type="text"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  placeholder="New Generation of Dining"
                  value={formData.heroTagline}
                  onChange={(e) => setFormData({ ...formData, heroTagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About Text</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold resize-none"
                  placeholder="Tell customers about your café..."
                  value={formData.aboutText}
                  onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Footer Description</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold resize-none"
                  placeholder="Short description shown in the footer..."
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-50 p-2.5 rounded-xl">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Working Hours</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mon - Fri</label>
                <input
                  type="text"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  placeholder="08:00 - 22:00"
                  value={formData.workingHoursWeekdays}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekdays: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sat - Sun</label>
                <input
                  type="text"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  placeholder="09:00 - 23:00"
                  value={formData.workingHoursWeekend}
                  onChange={(e) => setFormData({ ...formData, workingHoursWeekend: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Social Media Links</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: "websiteUrl", label: "Website URL" },
                { key: "facebookUrl", label: "Facebook URL" },
                { key: "instagramUrl", label: "Instagram URL" },
                { key: "twitterUrl", label: "Twitter / X URL" },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                      placeholder="https://"
                      value={(formData as Record<string, string>)[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-50 p-2.5 rounded-xl">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Checkout & Taxes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency Symbol</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="text"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Rate (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    step="0.1"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Charge (%)</label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="number"
                    step="0.1"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={formData.serviceCharge}
                    onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-red-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-slate-300"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
