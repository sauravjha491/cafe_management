"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Edit2, Trash2, 
  Image as ImageIcon, Check, X, Star, Loader2, Link as LinkIcon, Upload 
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [imageSourceType, setImageSourceType] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      toast.error("Cloud storage is not configured. Please use Image URL instead.");
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `menu/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

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
    setCategories(Array.isArray(catData) ? catData : []);
    setProducts(Array.isArray(prodData.products) ? prodData.products : []);
    if (Array.isArray(catData) && catData.length > 0 && !formData.categoryId) {
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
    setImageSourceType("url");
    setIsUploading(false);
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
    setImageSourceType("url");
    setIsUploading(false);
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100 animate-pulse h-[420px]" />
          ))
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              layout
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 flex flex-col group hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500"
            >
              {/* Product Image */}
              <div className="relative h-56 w-full bg-gray-50 overflow-hidden">
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-200" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-5 left-5">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-lg backdrop-blur-md",
                    product.available 
                      ? "bg-green-500/90 text-white" 
                      : "bg-red-500/90 text-white"
                  )}>
                    {product.available ? "Available" : "Sold Out"}
                  </span>
                </div>

                {/* Featured Star */}
                {product.featured && (
                  <div className="absolute top-5 right-5 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Product Info */}
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0">
                      {product.category.name}
                    </span>
                    {product.stock >= 0 && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest",
                        product.stock < 10 ? "text-orange-500" : "text-gray-400"
                      )}>
                        {product.stock} In Stock
                      </span>
                    )}
                  </div>
                  <h3 className="font-black text-gray-900 text-xl line-clamp-2 leading-tight group-hover:text-red-600 transition-colors h-14">
                    {product.name}
                  </h3>
                </div>

                <p className="text-gray-400 text-sm font-medium line-clamp-2 mb-6 flex-1 leading-relaxed">
                  {product.description}
                </p>

                <div className="flex flex-col gap-4 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-900">
                      <span className="text-red-600 text-sm mr-1">Rs.</span>
                      {product.price.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                      className="flex-1 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleAvailability(product.id, product.available); }}
                        className={cn(
                          "p-3.5 rounded-2xl transition-all shadow-sm active:scale-95 border",
                          product.available 
                            ? "bg-green-50 border-green-100 text-green-600 hover:bg-green-600 hover:text-white" 
                            : "bg-orange-50 border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white"
                        )}
                        title={product.available ? "Mark as Sold Out" : "Mark as Available"}
                      >
                        {product.available ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                        className="p-3.5 bg-gray-50 border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
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
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Price (Rs.)</label>
                      <input
                        required
                        type="number"
                        step="1"
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

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Product Image</label>
                      <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setImageSourceType("url")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5",
                            imageSourceType === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <LinkIcon className="w-3 h-3" />
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceType("upload")}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1.5",
                            imageSourceType === "upload" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          <Upload className="w-3 h-3" />
                          Upload
                        </button>
                      </div>
                    </div>

                    {imageSourceType === "url" ? (
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-medium"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      />
                    ) : (
                      <div className="relative group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={isUploading}
                        />
                        <label
                          htmlFor="image-upload"
                          className={cn(
                            "w-full flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-red-200 hover:bg-red-50/30 transition-all",
                            isUploading && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isUploading ? (
                            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                          ) : formData.image ? (
                            <div className="relative w-full h-32 rounded-xl overflow-hidden">
                              <Image src={formData.image} alt="Preview" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">Change Image</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-3 bg-white rounded-xl shadow-sm">
                                <Upload className="w-6 h-6 text-red-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-bold text-gray-900">Click to upload</p>
                                <p className="text-[10px] font-medium text-gray-400">PNG, JPG or WEBP (Max. 2MB)</p>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    )}
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
                  disabled={isSubmitting || isUploading}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : isUploading ? "Uploading Image..." : editingProduct ? "Update Product" : "Create Product"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
