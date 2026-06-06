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
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Staff Management</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">Manage team members and their access levels</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 w-full md:w-auto text-sm md:text-base"
        >
          <Plus className="w-5 h-5" />
          Add Team Member
        </button>
      </div>

      <div className="bg-white p-3 md:p-4 rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-[2.5rem] animate-pulse" />)
        ) : (
          filteredStaff.map((member) => (
            <motion.div
              layout
              key={member.id}
              className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 relative group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black transition-transform group-hover:scale-110",
                  member.role === "OWNER" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                )}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                  member.role === "OWNER" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                )}>
                  {member.role === "OWNER" ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {member.role}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight truncate">{member.name}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm font-medium truncate">
                  <Mail className="w-4 h-4 shrink-0" />
                  {member.email}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex gap-2">
                <Link 
                  href={`/admin/staff/${member.id}`}
                  className="flex-1 py-2.5 rounded-xl border border-gray-100 font-bold text-xs md:text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Edit Profile
                </Link>
                <button 
                  onClick={() => handleDelete(member.id)}
                  className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
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
