"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, 
  User, Shield, ShieldCheck, Mail, 
  X, Loader2, MoreVertical, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { role } = useAuthStore();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STAFF",
    password: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const res = await fetch("/api/admin/staff");
    const data = await res.json();
    setStaff(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Staff member added");
        setIsModalOpen(false);
        fetchStaff();
        setFormData({ name: "", email: "", role: "STAFF", password: "" });
      }
    } catch (error) {
      toast.error("Failed to add staff");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStaff(staff.filter(s => s.id !== id));
        toast.success("Staff removed");
      }
    } catch (error) {
      toast.error("Failed to remove staff");
    }
  };

  const filteredStaff = staff.filter((s) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8">Loading staff members...</div>;
  }

  if (role !== "OWNER") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="bg-red-50 p-6 rounded-[2.5rem] mb-6">
          <Shield className="w-16 h-16 text-red-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-500 max-w-md font-medium">Only the Owner has permission to manage staff members and roles.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-slate-50/50">
      <div className="p-4 lg:p-8 shrink-0 bg-white border-b border-slate-100 lg:bg-transparent lg:border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Staff Management</h1>
            <p className="text-slate-500 font-medium">Manage team members and their access levels</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Add Team Member
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:px-8 space-y-8 pb-20">
        {/* Search */}
        <div className="bg-white p-4 rounded-2xl lg:rounded-[2rem] shadow-sm border border-slate-100 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-red-600 transition-colors" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-16 pr-8 py-4 bg-slate-50 border border-transparent rounded-xl lg:rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/5 outline-none font-bold transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member) => (
            <motion.div
              layout
              key={member.id}
              className="bg-white p-8 rounded-2xl lg:rounded-[2.5rem] shadow-sm border border-slate-100 relative group hover:shadow-2xl transition-all duration-500"
            >
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-transform group-hover:scale-110",
                  member.role === "OWNER" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                )}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                  member.role === "OWNER" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                  {member.role === "OWNER" ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  {member.role}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight truncate group-hover:text-red-600 transition-colors">{member.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium truncate">
                  <Mail className="w-4 h-4 shrink-0" />
                  {member.email}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 flex gap-2">
                <Link 
                  href={`/admin/staff/${member.id}`}
                  className="flex-1 py-3.5 bg-slate-50 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-95"
                >
                  Edit Profile
                </Link>
                <button 
                  onClick={() => handleDelete(member.id)}
                  className="p-3.5 bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[70] rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">New Staff</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    required
                    type="email"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    placeholder="john@cafepro.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      required
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium ml-1">Staff will use this password to login</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Access Role</label>
                  <select
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-black text-gray-600"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Orders only)</option>
                    <option value="OWNER">OWNER (Full access)</option>
                  </select>
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Add to Team"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
