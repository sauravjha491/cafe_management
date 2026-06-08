"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bike, Plus, Search, MoreVertical, 
  Trash2, Edit2, Phone, Mail, 
  CheckCircle2, XCircle, Loader2,
  User, Shield, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

interface Rider {
  id: string;
  vehicleNumber: string;
  isAvailable: boolean;
  status: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
}

export default function RiderManagement() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    password: "rider123" // Default password
  });

  const fetchRiders = async () => {
    try {
      const res = await fetch("/api/admin/riders");
      const data = await res.json();
      setRiders(data);
    } catch (e) {
      toast.error("Failed to fetch riders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Rider added successfully");
        setShowModal(false);
        setFormData({ name: "", email: "", phone: "", vehicleNumber: "", password: "rider123" });
        fetchRiders();
      } else {
        throw new Error("Failed to add rider");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (rider: Rider) => {
    const newStatus = rider.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rider.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Rider marked as ${newStatus}`);
        fetchRiders();
      }
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rider?")) return;
    try {
      const res = await fetch(`/api/admin/riders?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Rider deleted");
        fetchRiders();
      }
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const filteredRiders = riders.filter(r => 
    r.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Rider Fleet</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Manage your delivery partners</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search riders..."
              className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/5 font-bold transition-all w-full md:w-64 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Add Rider
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Riders", value: riders.length, icon: Bike, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Now", value: riders.filter(r => r.status === "ACTIVE").length, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "On Duty", value: riders.filter(r => r.isAvailable).length, icon: Shield, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-8 h-8", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rider Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Fetching Fleet Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRiders.map((rider) => (
            <motion.div 
              layout
              key={rider.id}
              className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
                  <User className="w-10 h-10 text-gray-300" />
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 py-1 text-[8px] font-black uppercase tracking-widest text-center",
                    rider.status === "ACTIVE" ? "bg-green-500 text-white" : "bg-gray-400 text-white"
                  )}>
                    {rider.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleStatus(rider)}
                    className={cn(
                      "p-3 rounded-2xl transition-all",
                      rider.status === "ACTIVE" ? "bg-gray-50 text-gray-400 hover:text-red-600" : "bg-green-50 text-green-600 hover:bg-green-100"
                    )}
                    title={rider.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  >
                    {rider.status === "ACTIVE" ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => handleDelete(rider.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">{rider.user.name}</h3>
                  <div className="flex items-center gap-2 text-red-600">
                    <Bike className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">{rider.vehicleNumber}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-gray-500">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-bold">{rider.user.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-bold line-clamp-1">{rider.user.email}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                    rider.isAvailable ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-400"
                  )}>
                    {rider.isAvailable ? "Available" : "Busy"}
                  </span>
                  <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-red-600 transition-colors">
                    View Orders
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Rider Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">New Rider</h3>
                  <button onClick={() => setShowModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <XCircle className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleAddRider} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        required
                        type="text"
                        placeholder="John Doe"
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vehicle Number</label>
                      <input 
                        required
                        type="text"
                        placeholder="BA 1 PA 1234"
                        className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      required
                      type="email"
                      placeholder="rider@cafe.pro"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      required
                      type="tel"
                      placeholder="+977 9800000000"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Onboard Rider"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
