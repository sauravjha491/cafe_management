"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, 
  X, Loader2, User, ArrowLeft,
  ChevronRight, Phone, Mail, Calendar,
  ShoppingBag, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/pos/customers");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setIsSubmitting(true);
    try {
      // Note: Assuming same API for create/update, check if PATCH exists
      const url = editingCustomer ? `/api/pos/customers?id=${editingCustomer.id}` : "/api/pos/customers";
      const method = editingCustomer ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCustomer ? "Customer updated" : "Customer created");
        setFormData({ name: "", phone: "", email: "" });
        setEditingCustomer(null);
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Action failed");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95">
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Customers</h1>
            <p className="text-gray-500 font-medium">Manage your customer database and loyalty</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setFormData({ name: "", phone: "", email: "" }); setIsModalOpen(true); }}
          className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Add Customer
        </button>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-red-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search by name or phone number..."
            className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-8 focus:ring-red-500/5 outline-none font-bold transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Database</p>
            <h3 className="text-2xl font-black text-gray-900 leading-none">{customers.length}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Customers List/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-[2.5rem] animate-pulse border border-gray-50" />
          ))
        ) : (
          filteredCustomers.map((customer) => (
            <motion.div
              layout
              key={customer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors relative">
                  <User className="w-8 h-8" />
                  {customer.orders?.length > 5 && (
                    <div className="absolute -top-1 -right-1 p-1 bg-yellow-400 rounded-full">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingCustomer(customer); setFormData({ name: customer.name, phone: customer.phone, email: customer.email || "" }); setIsModalOpen(true); }}
                    className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-red-600 transition-colors truncate">
                    {customer.name}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    Customer Since {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="pt-4 space-y-3 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                    <Phone className="w-4 h-4 text-gray-300" />
                    {customer.phone}
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-3 text-gray-500 font-bold text-sm">
                      <Mail className="w-4 h-4 text-gray-300" />
                      {customer.email}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-red-500" />
                    <span className="font-black text-gray-900 text-sm">{customer.posOrders?.length || 0} Orders</span>
                  </div>
                  <button className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                    History <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-gray-900">
                  {editingCustomer ? "Edit Customer" : "New Customer"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Full Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="Enter name"
                      className="w-full px-7 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Phone Number</label>
                    <input 
                      required
                      type="tel"
                      placeholder="e.g. 03001234567"
                      className="w-full px-7 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Email (Optional)</label>
                    <input 
                      type="email"
                      placeholder="customer@example.com"
                      className="w-full px-7 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (editingCustomer ? "Update Customer" : "Save Customer")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
