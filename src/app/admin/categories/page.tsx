"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, 
  X, Loader2, Tag, ArrowLeft,
  ChevronRight, MoreVertical, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      const url = editingCategory ? `/api/categories?id=${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (res.ok) {
        toast.success(editingCategory ? "Category updated" : "Category created");
        setNewCategoryName("");
        setEditingCategory(null);
        setIsModalOpen(false);
        fetchCategories();
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will become uncategorized.")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error("Could not delete category");
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col min-w-0 bg-slate-50/50">
      {/* Header Area */}
      <div className="p-4 lg:p-8 shrink-0 bg-white border-b border-slate-100 lg:bg-transparent lg:border-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95">
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Categories</h1>
              <p className="text-slate-500 font-medium">Manage your product categories</p>
            </div>
          </div>
          <button 
            onClick={() => { setEditingCategory(null); setNewCategoryName(""); setIsModalOpen(true); }}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6" />
            Add Category
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:px-8 space-y-10 pb-20">
        {/* Stats & Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 group-focus-within:text-red-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search categories..."
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-2xl lg:rounded-[2rem] shadow-sm focus:ring-8 focus:ring-red-500/5 outline-none font-bold transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="bg-white p-6 rounded-2xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
              <h3 className="text-2xl font-black text-slate-900 leading-none">{categories.length}</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-red-600">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-2xl lg:rounded-[2.5rem] animate-pulse border border-slate-50" />
            ))
          ) : (
            filteredCategories.map((cat) => (
              <motion.div
                layout
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 lg:p-8 rounded-2xl lg:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                    <Tag className="w-7 h-7" />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingCategory(cat); setNewCategoryName(cat.name); setIsModalOpen(true); }}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-red-600 transition-colors truncate">
                  {cat.name}
                </h3>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {cat.products?.length || 0} Products
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))
          )}
        </div>
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
                  {editingCategory ? "Edit Category" : "New Category"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-3 block">Category Name</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    placeholder="e.g. Hot Coffee"
                    className="w-full px-8 py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-lg"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (editingCategory ? "Update Category" : "Create Category")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
