"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, 
  Image as ImageIcon, Check, X, Star, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // ... (existing useEffect and fetchData)

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (res.ok) {
        toast.success("Category added");
        setNewCategoryName("");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to add category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? All products in it will be affected.")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: "",
    featured: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [catRes, prodRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/admin/products")
    ]);
    const catData = await catRes.json();
    const prodData = await prodRes.json();
    setCategories(catData);
    setProducts(prodData);
    if (catData.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: catData[0].id }));
    }
    setLoading(false);
  };

  const toggleAvailability = async (productId: string, current: boolean) => {
    // Optimistic update
    const previousProducts = [...products];
    setProducts(products.map(p => p.id === productId ? { ...p, available: !current } : p));

    try {
      const res = await fetch(`/api/admin/products?id=${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !current }),
      });
      if (!res.ok) throw new Error();
      toast.success("Availability updated");
    } catch (error) {
      setProducts(previousProducts);
      toast.error("Failed to update availability");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    // Optimistic delete
    const previousProducts = [...products];
    setProducts(products.filter(p => p.id !== id));

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product deleted");
    } catch (error) {
      setProducts(previousProducts);
      toast.error("Failed to delete product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const method = editingProduct ? "PATCH" : "POST";
      const url = editingProduct ? `/api/admin/products?id=${editingProduct.id}` : "/api/admin/products";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingProduct ? "Product updated" : "Product created");
        setIsModalOpen(false);
        fetchData();
        resetForm();
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      categoryId: categories[0]?.id || "",
      image: "",
      featured: false,
    });
    setEditingProduct(null);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId,
      image: product.image,
      featured: product.featured,
    });
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">Add, edit, or remove items from your menu</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-700 px-4 md:px-6 py-3 md:py-3.5 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm md:text-base"
          >
            Categories
          </button>
          <button className="flex-[2] md:flex-none bg-red-600 text-white px-4 md:px-6 py-3 md:py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 text-sm md:text-base"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 md:p-4 rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-gray-600 text-sm md:text-base cursor-pointer"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table / Cards */}
      <div className="bg-white rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Product</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1, 2, 3].map(i => <tr key={i} className="h-20 animate-pulse bg-gray-50/50" />)
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{product.name}</span>
                            {product.featured && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-1 font-medium">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-black text-gray-500 uppercase">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-gray-900">${product.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleAvailability(product.id, product.available)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                          product.available 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {product.available ? "Available" : "Sold Out"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openEditModal(product)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="p-4 h-24 animate-pulse bg-gray-50/50" />)
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="p-4 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 truncate">{product.name}</span>
                      {product.featured && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase">
                        {product.category.name}
                      </span>
                      <span className="font-black text-gray-900 text-sm">${product.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  <button 
                    onClick={() => toggleAvailability(product.id, product.available)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex-1",
                      product.available 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {product.available ? "Available" : "Sold Out"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:text-blue-600 transition-colors border border-gray-100"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:text-red-600 transition-colors border border-gray-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[70] rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900">Manage Categories</h2>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="flex gap-2 mb-8">
                <input
                  required
                  type="text"
                  placeholder="New category name..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-6 rounded-xl font-bold active:scale-95 disabled:bg-gray-300"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add"}
                </button>
              </form>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all">
                    <span className="font-bold text-gray-700">{cat.name}</span>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Modal */}
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
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white z-[70] rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-black text-gray-900">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-medium resize-none"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Price ($)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-medium"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold text-gray-600"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Image URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-medium"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    />
                  </div>

                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-red-600"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    <span className="font-bold text-gray-700">Mark as Featured Item</span>
                  </label>
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
