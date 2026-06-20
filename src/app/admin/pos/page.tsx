"use client";

import { useEffect, useState, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Minus, X, 
  ShoppingCart, User, CreditCard, 
  Banknote, Wallet, QrCode, 
  Printer, Trash2, Pause, Play,
  ChevronRight, Loader2, Sparkles,
  UserPlus, Info, Tag, Download,
  History, Settings as SettingsIcon,
  Calculator, Receipt, Package, ArrowLeft,
  Users, Check, Save, RefreshCw, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useAuthStore } from "@/store/useAuthStore";
import { jsPDF } from "jspdf";

// --- Types ---

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  category?: { name: string };
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  discount?: number;
  image?: string;
  categoryName?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// --- Components ---

const ProductCard = memo(({ 
  product, 
  onAdd, 
  onRemove, 
  quantityInCart,
  currency 
}: { 
  product: Product; 
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
  quantityInCart: number;
  currency: string;
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all overflow-hidden flex flex-col group h-full"
    >
      {/* Product Image Container */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-gray-50">
        <Image 
          src={product.image} 
          alt={product.name} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Stock Badge */}
        <div className={cn(
          "absolute top-3 right-3 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
          (product.stock > 0 || product.stock === -1) ? (product.stock > 0 && product.stock < 10 ? "bg-orange-500/90 text-white" : "bg-green-500/90 text-white") : "bg-red-500/90 text-white"
        )}>
          {product.stock === -1 ? "In Stock" : (product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock")}
        </div>

        {/* Category Badge */}
        {product.category?.name && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[8px] font-black text-gray-900 uppercase tracking-widest border border-white/20 shadow-sm">
            {product.category.name}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{product.category?.name || 'General'}</p>
          <h4 className="font-black text-gray-900 text-base line-clamp-2 leading-tight h-10 group-hover:text-red-600 transition-colors">
            {product.name}
          </h4>
        </div>
        
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-gray-900 text-xl">
              <span className="text-red-600 text-sm mr-1">{currency}</span>
              {product.price.toLocaleString()}
            </p>
          </div>

          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(product.id); }}
                className="w-11 h-11 rounded-xl bg-white text-gray-900 hover:text-red-600 shadow-sm flex items-center justify-center transition-all active:scale-90 border border-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">Qty</span>
                <span className="text-lg font-black text-gray-900 w-8 text-center leading-none">{quantityInCart}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onAdd(product); }}
                disabled={product.stock !== -1 && product.stock <= quantityInCart}
                className="w-11 h-11 rounded-xl bg-white text-gray-900 hover:text-red-600 shadow-sm flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 border border-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              disabled={product.stock === 0}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-red-600 hover:shadow-red-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale group-hover:shadow-red-500/20"
            >
              <Plus className="w-4 h-4" />
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = "ProductCard";

// --- Main Page ---

export default function POSPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Modals & UI State
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [showHeldOrdersModal, setShowHeldOrdersModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>("");
  
  // Feature States
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "QR" | "WALLET">("CASH");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [customItem, setCustomItem] = useState({ name: "", price: "", quantity: "1" });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [settings, setSettings] = useState({
    currency: "Rs.",
    taxRate: 5.0,
    serviceCharge: 2.0,
    cafeName: "CafePro",
    address: "123 Cafe Street",
    phone: "1234567890"
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
    fetchHeldOrders();
  }, []);

  useEffect(() => {
    if (selectedCategory !== null || searchQuery !== "") {
      fetchProducts(1, false);
    }
  }, [selectedCategory, searchQuery]);

  const fetchInitialData = async () => {
    try {
      const [categoriesData, settingsData] = await Promise.all([
        fetch("/api/categories").then(res => res.json()),
        fetch("/api/admin/settings").then(res => res.json())
      ]);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      if (settingsData && !settingsData.error) setSettings(settingsData);
    } catch (e) {
      toast.error("Failed to fetch initial data");
    }
  };

  const fetchProducts = async (page = 1, append = false) => {
    setIsLoadingProducts(true);
    try {
      const categoryParam = selectedCategory && selectedCategory !== "all" ? `&categoryId=${selectedCategory}` : "";
      const searchParam = searchQuery ? `&search=${searchQuery}` : "";
      const res = await fetch(`/api/admin/products?page=${page}&limit=16${categoryParam}${searchParam}`);
      const data = await res.json();
      
      if (data.products) {
        setProducts(prev => append ? [...prev, ...data.products] : data.products);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.pages
        });
      }
    } catch (e) {
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchProducts(pagination.page + 1, true);
    }
  };

  const fetchHeldOrders = async () => {
    try {
      const res = await fetch("/api/pos/order?held=true");
      const data = await res.json();
      setHeldOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch held orders");
    }
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (product.stock <= existing.quantity) {
            toast.error("Max stock reached");
            return prev;
        }
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        categoryName: product.category?.name
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id || item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateItemNote = (id: string, note: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note } : item));
  };

  const addCustomItem = () => {
    if (!customItem.name || !customItem.price) return;
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: customItem.name,
      price: parseFloat(customItem.price),
      quantity: parseInt(customItem.quantity),
    };
    setCart(prev => [...prev, newItem]);
    setCustomItem({ name: "", price: "", quantity: "1" });
    setShowCustomItemModal(false);
    toast.success("Custom item added");
  };

  // Calculations
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * globalDiscount) / 100, [subtotal, globalDiscount]);
  const taxableAmount = subtotal - discountAmount;
  const tax = useMemo(() => (taxableAmount * settings.taxRate) / 100, [taxableAmount, settings.taxRate]);
  const serviceCharge = useMemo(() => (taxableAmount * settings.serviceCharge) / 100, [taxableAmount, settings.serviceCharge]);
  const total = useMemo(() => taxableAmount + tax + serviceCharge, [taxableAmount, tax, serviceCharge]);
  const change = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - total);
  }, [cashReceived, total]);

  // Actions
  const handleHoldOrder = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/pos/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "HELD",
          staffId: user?.uid,
          staffEmail: user?.email,
          items: cart,
          customerName: selectedCustomer?.name,
          customerPhone: selectedCustomer?.phone,
          customerId: selectedCustomer?.id,
          subtotal,
          tax,
          discount: discountAmount,
          serviceCharge,
          total,
          paymentMethod: "CASH", // Dummy for held
        })
      });
      if (res.ok) {
        toast.success("Order saved to drafts");
        setCart([]);
        setSelectedCustomer(null);
        fetchHeldOrders();
      }
    } catch (e) {
      toast.error("Failed to hold order");
    } finally {
      setIsProcessing(false);
    }
  };

  const resumeOrder = (order: any) => {
    setCart(order.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      note: item.note,
      discount: item.discount
    })));
    setSelectedCustomer(order.customerId ? { 
      id: order.customerId, 
      name: order.customerName, 
      phone: order.customerPhone 
    } : null);
    setShowHeldOrdersModal(false);
    toast.success("Order resumed");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (paymentMethod === "CASH" && (!cashReceived || parseFloat(cashReceived) < total)) {
      toast.error("Insufficient cash received");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/pos/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: user?.uid,
          staffEmail: user?.email,
          items: cart,
          customerName: selectedCustomer?.name || "Walk-in Customer",
          customerPhone: selectedCustomer?.phone,
          customerId: selectedCustomer?.id,
          subtotal,
          tax,
          discount: discountAmount,
          serviceCharge,
          total,
          paymentMethod,
          received: parseFloat(cashReceived),
          change,
          status: "COMPLETED"
        })
      });

      if (res.ok) {
        const order = await res.json();
        setShowReceipt(order);
        setCart([]);
        setSelectedCustomer(null);
        setCashReceived("");
        setGlobalDiscount(0);
        toast.success("Transaction successful!");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Checkout failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadReceiptPDF = () => {
    if (!showReceipt) return;
    const doc = new jsPDF();
    
    doc.setFont("courier");
    doc.setFontSize(20);
    doc.text(settings.cafeName, 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(settings.address || "", 105, 28, { align: "center" });
    doc.text(`Tel: ${settings.phone || ""}`, 105, 33, { align: "center" });
    
    doc.line(20, 40, 190, 40);
    
    doc.text(`Order: #${showReceipt.orderNumber}`, 20, 50);
    doc.text(`Date: ${new Date(showReceipt.createdAt).toLocaleString()}`, 20, 55);
    doc.text(`Staff: ${showReceipt.staffId}`, 20, 60);
    doc.text(`Customer: ${showReceipt.customerName || "Walk-in"}`, 20, 65);
    
    doc.line(20, 70, 190, 70);
    
    let y = 80;
    showReceipt.items.forEach((item: any) => {
      doc.text(`${item.name}`, 20, y);
      doc.text(`${item.quantity} x ${settings.currency}${item.price}`, 20, y + 5);
      doc.text(`${settings.currency}${(item.quantity * item.price).toLocaleString()}`, 190, y + 5, { align: "right" });
      y += 15;
    });
    
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.text("Subtotal:", 140, y);
    doc.text(`${settings.currency}${showReceipt.subtotal.toLocaleString()}`, 190, y, { align: "right" });
    
    doc.text(`Tax (${settings.taxRate}%):`, 140, y + 5);
    doc.text(`${settings.currency}${showReceipt.tax.toLocaleString()}`, 190, y + 5, { align: "right" });
    
    if (showReceipt.discount > 0) {
      doc.text("Discount:", 140, y + 10);
      doc.text(`-${settings.currency}${showReceipt.discount.toLocaleString()}`, 190, y + 10, { align: "right" });
      y += 5;
    }
    
    doc.setFontSize(14);
    doc.setFont("courier", "bold");
    doc.text("TOTAL:", 140, y + 10);
    doc.text(`${settings.currency}${showReceipt.total.toLocaleString()}`, 190, y + 10, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("courier", "normal");
    doc.text("Thank you for your visit!", 105, y + 30, { align: "center" });
    
    doc.save(`Receipt-${showReceipt.orderNumber}.pdf`);
  };

  const getQuantityInCart = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50/50 gap-0 overflow-hidden relative">
      <Toaster position="top-right" />
      
      {/* --- LEFT SIDE: PRODUCTS AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white lg:bg-transparent">
        
        {/* Header: Search & Info */}
        <div className="p-4 lg:p-8 flex flex-col gap-4 lg:gap-6 shrink-0 bg-white lg:bg-transparent sticky top-0 z-30 border-b lg:border-0 border-slate-100">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex-1 relative group">
                <Search className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 lg:w-6 lg:h-6 group-focus-within:text-red-600 transition-colors" />
                <input 
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 lg:pl-16 pr-10 lg:pr-14 py-3 lg:py-5 bg-slate-50 lg:bg-white border border-transparent lg:border-transparent rounded-xl lg:rounded-2xl shadow-sm lg:shadow-md focus:ring-4 focus:ring-red-500/5 outline-none font-bold transition-all text-sm lg:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button 
                        onClick={() => { setSearchQuery(""); if (selectedCategory === null) setSelectedCategory("all"); }}
                        className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 p-1.5 lg:p-2 bg-slate-200 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                    >
                        <X className="w-3 h-3 lg:w-4 lg:h-4" />
                    </button>
                )}
            </div>
            <button 
                onClick={() => setShowCartMobile(true)}
                className="lg:hidden relative p-3 bg-red-600 text-white rounded-xl shadow-lg shadow-red-200 active:scale-95 transition-all"
                aria-label="Open cart"
            >
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-slate-900 border-2 border-white text-[10px] font-black rounded-full flex items-center justify-center">
                    {cart.length}
                </span>
                )}
            </button>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2 lg:gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0 sticky top-0 z-10 bg-inherit">
            <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                "px-5 lg:px-8 py-2.5 lg:py-3.5 rounded-xl text-[10px] lg:text-[11px] font-black whitespace-nowrap transition-all uppercase tracking-widest flex items-center gap-2 border-2",
                selectedCategory === "all" ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-105" : "bg-white text-slate-400 border-transparent hover:border-slate-100 hover:bg-slate-50 shadow-sm"
                )}
            >
                <Package className="w-4 h-4" />
                All
            </button>
            {categories.map(cat => (
                <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                    "px-5 lg:px-8 py-2.5 lg:py-3.5 rounded-xl text-[10px] lg:text-[11px] font-black whitespace-nowrap transition-all uppercase tracking-widest border-2",
                    selectedCategory === cat.id ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-105" : "bg-white text-slate-400 border-transparent hover:border-slate-100 hover:bg-slate-50 shadow-sm"
                )}
                >
                {cat.name}
                </button>
            ))}
          </div>
        </div>

        {/* Product Grid - Responsive */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-8 pb-24 lg:pb-8">
          {selectedCategory === null && searchQuery === "" ? (
            /* --- CATEGORY-FIRST VIEW --- */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 py-6 lg:py-8">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedCategory("all")}
                className="group relative h-40 lg:h-48 bg-slate-900 rounded-2xl lg:rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-transparent" />
                <div className="relative h-full flex flex-col items-center justify-center gap-3 lg:gap-4 text-white">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-xl lg:rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 lg:w-8 lg:h-8" />
                  </div>
                  <span className="text-sm lg:text-lg font-black uppercase tracking-[0.2em]">All Items</span>
                </div>
              </motion.button>
              
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="group relative h-40 lg:h-48 bg-white rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative h-full flex flex-col items-center justify-center gap-3 lg:gap-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-50 rounded-xl lg:rounded-2xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                      <Tag className="w-6 h-6 lg:w-8 lg:h-8" />
                    </div>
                    <span className="text-sm lg:text-lg font-black text-slate-900 uppercase tracking-widest">{cat.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            /* --- PRODUCT GRID VIEW --- */
            <div className="py-6 lg:py-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                {products.map(product => (
                  <ProductCard 
                      key={product.id}
                      product={product}
                      currency={settings.currency}
                      onAdd={addToCart}
                      onRemove={(id) => updateQuantity(id, -1)}
                      quantityInCart={getQuantityInCart(product.id)}
                  />
                ))}
              </div>

              {/* Empty State */}
              {products.length === 0 && !isLoadingProducts && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-[10px]">No products available</p>
                </div>
              )}

              {/* Loading State */}
              {isLoadingProducts && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="h-64 lg:h-72 bg-white rounded-2xl lg:rounded-3xl animate-pulse border border-slate-50" />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {pagination.page < pagination.totalPages && (
                <div className="flex justify-center pt-8">
                  <button 
                    onClick={loadMore}
                    disabled={isLoadingProducts}
                    className="px-8 lg:px-12 py-3 lg:py-5 bg-white border border-slate-100 text-slate-900 rounded-xl lg:rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                  >
                    {isLoadingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDE: CART AREA (ORDER PANEL) --- */}
      <AnimatePresence>
        {(showCartMobile || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartMobile(false)}
              className="fixed inset-0 bg-slate-900/60 z-[60] lg:hidden backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 right-0 z-[70] w-full max-w-[400px] bg-white lg:relative lg:z-0 lg:w-[400px] border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none overflow-hidden",
                !showCartMobile && "hidden lg:flex"
              )}
            >
              {/* Cart Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Current Order</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                      {cart.reduce((a, b) => a + b.quantity, 0)} Items Selected
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowHeldOrdersModal(true)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative shadow-sm"
                  >
                    <History className="w-5 h-5" />
                    {heldOrders.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white text-[8px] font-black text-white rounded-full flex items-center justify-center">
                        {heldOrders.length}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => setShowCartMobile(false)} 
                    className="lg:hidden p-3 bg-slate-50 text-slate-400 rounded-xl"
                    aria-label="Close cart"
                >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Customer Selector */}
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Customer</p>
                    <p className="font-black text-slate-900 text-xs truncate">
                      {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {selectedCustomer && (
                    <button 
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setShowCustomerModal(true)}
                    className="p-2.5 bg-white text-slate-400 hover:text-red-600 rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-white">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-200 py-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
                      <ShoppingCart className="w-12 h-12 opacity-10" />
                    </div>
                    <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Your cart is empty</h4>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cart.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        key={item.id} 
                        className="flex gap-4 group bg-white p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-50 shadow-sm">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                              <Sparkles className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                                <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h5>
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mt-0.5">
                                  {settings.currency}{item.price}
                                </p>
                            </div>
                            <button 
                              onClick={() => updateQuantity(item.productId || item.id, -item.quantity)} 
                              className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <p className="font-black text-slate-900 text-sm">
                              {settings.currency}{(item.price * item.quantity).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 bg-white p-0.5 rounded-lg border border-slate-100 shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.productId || item.id, -1)} 
                                className="w-7 h-7 rounded-md bg-slate-50 text-slate-900 hover:text-red-600 transition-all active:scale-90 flex items-center justify-center"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.productId || item.id, 1)} 
                                className="w-7 h-7 rounded-md bg-slate-50 text-slate-900 hover:text-red-600 transition-all active:scale-90 flex items-center justify-center"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Summary & Checkout Footer */}
              <div className="shrink-0 bg-white">
                {/* Action Buttons */}
                <div className="px-6 py-4 grid grid-cols-4 gap-2 border-t border-slate-50">
                  {[
                    { id: 'custom', icon: Plus, label: 'Custom', onClick: () => setShowCustomItemModal(true) },
                    { id: 'discount', icon: Tag, label: 'Discount', onClick: () => setShowDiscountModal(true) },
                    { id: 'hold', icon: Pause, label: 'Hold', onClick: handleHoldOrder, disabled: cart.length === 0 || isProcessing },
                    { id: 'clear', icon: Trash2, label: 'Clear', onClick: () => setCart([]), disabled: cart.length === 0 }
                  ].map(btn => (
                    <button 
                      key={btn.id}
                      onClick={btn.onClick}
                      disabled={btn.disabled}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all group disabled:opacity-30 active:scale-95"
                    >
                      <btn.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="text-[7px] font-black uppercase tracking-widest">{btn.label}</span>
                    </button>
                  ))}
                </div>

                {/* Totals Section */}
                <div className="p-6 lg:p-8 bg-slate-900 text-white space-y-6">
                  <div className="space-y-3 opacity-80">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-white font-mono">{settings.currency}{subtotal.toLocaleString()}</span>
                    </div>
                    {globalDiscount > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-orange-400">
                        <span>Discount ({globalDiscount}%)</span>
                        <span className="font-mono">-{settings.currency}{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Tax ({settings.taxRate}%)</span>
                      <span className="text-white font-mono">{settings.currency}{tax.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Grand Total</p>
                      <h2 className="text-3xl font-black tracking-tighter text-white leading-none">
                        {settings.currency}{total.toLocaleString()}
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { id: "CASH", icon: Banknote },
                        { id: "CARD", icon: CreditCard },
                        { id: "QR", icon: QrCode }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id as any)}
                          aria-label={`Pay with ${m.id}`}
                          className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center transition-all border-2",
                            paymentMethod === m.id ? "bg-red-600 border-red-500 shadow-lg scale-110" : "bg-white/5 border-transparent text-slate-400"
                          )}
                        >
                          <m.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash Inputs */}
                  {paymentMethod === "CASH" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="pt-4 flex gap-4"
                    >
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Received</p>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-white outline-none focus:border-red-500 transition-all font-mono"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Change</p>
                        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-black text-green-400 font-mono truncate">
                          {settings.currency}{change.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    disabled={isProcessing || cart.length === 0 || (paymentMethod === "CASH" && (!cashReceived || parseFloat(cashReceived) < total))}
                    onClick={handleCheckout}
                    className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 disabled:grayscale"
                  >
                    {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                      <>
                        Pay & Complete
                        <ChevronRight className="w-6 h-6" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}
      
      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-red-50 rounded-[1.5rem] flex items-center justify-center text-red-600 shadow-sm">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Select Customer</h3>
                </div>
                <button onClick={() => setShowCustomerModal(false)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-colors" aria-label="Close modal">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                {/* New Customer Form */}
                <section>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 ml-1">Quick Add New Customer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input 
                      type="text"
                      placeholder="Full Name"
                      className="px-7 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-base"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input 
                      type="tel"
                      placeholder="Phone Number"
                      className="px-7 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-base"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <button 
                    onClick={async () => {
                      if (!newCustomer.name || !newCustomer.phone) return;
                      try {
                        const res = await fetch("/api/pos/customers", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(newCustomer)
                        });
                        const data = await res.json();
                        if (data.id) {
                          setSelectedCustomer(data);
                          setShowCustomerModal(false);
                          setNewCustomer({ name: "", phone: "", email: "" });
                          toast.success("Customer added and selected");
                        }
                      } catch (e) { toast.error("Failed to add customer"); }
                    }}
                    className="w-full mt-6 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95"
                  >
                    Add & Select Customer
                  </button>
                </section>

                {/* Existing Customer Search */}
                <section>
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 ml-1">Search Database</h4>
                  <div className="relative mb-6">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
                    <input 
                      type="text"
                      placeholder="Search by name or phone..."
                      className="w-full pl-16 pr-8 py-6 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-base"
                      onChange={async (e) => {
                        if (e.target.value.length < 2) return;
                        const res = await fetch(`/api/pos/customers?query=${e.target.value}`);
                      }}
                    />
                  </div>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Held Orders Modal */}
      <AnimatePresence>
        {showHeldOrdersModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHeldOrdersModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-sm">
                    <Pause className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Held Orders</h3>
                </div>
                <button onClick={() => setShowHeldOrdersModal(false)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl">
                  <X className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-5 no-scrollbar">
                {heldOrders.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No orders on hold</p>
                  </div>
                ) : (
                  heldOrders.map((order) => (
                    <div key={order.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Draft Order</span>
                          <p className="font-black text-gray-900 text-lg">{order.customerName || "Walk-in Customer"}</p>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                          {order.items.length} items • {settings.currency}{order.total.toLocaleString()} • {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => resumeOrder(order)}
                        className="p-5 bg-white text-blue-600 rounded-[1.5rem] shadow-md border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all active:scale-95"
                      >
                        <Play className="w-6 h-6 fill-current" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Discount Modal */}
      <AnimatePresence>
        {showDiscountModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiscountModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[3.5rem] shadow-2xl p-10"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <Tag className="w-8 h-8 text-red-600" />
                Add Discount
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[0, 5, 10, 15, 20, 25, 30, 50, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      setGlobalDiscount(val);
                      setShowDiscountModal(false);
                      toast.success(`${val}% discount applied`);
                    }}
                    className={cn(
                      "py-4 rounded-2xl font-black text-xs transition-all",
                      globalDiscount === val ? "bg-red-600 text-white shadow-lg shadow-red-200" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    {val}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="Enter custom %"
                  className="w-full px-8 py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-black transition-all text-center text-lg"
                  onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Item Modal */}
      <AnimatePresence>
        {showCustomItemModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomItemModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <Plus className="w-8 h-8 text-red-600" />
                Custom Item
              </h3>
              <div className="space-y-5">
                <input 
                  type="text"
                  placeholder="What's the item name?"
                  className="w-full px-8 py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className="flex gap-4">
                  <input 
                    type="number"
                    placeholder="Price"
                    className="flex-1 px-8 py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                    value={customItem.price}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                  />
                  <input 
                    type="number"
                    placeholder="Qty"
                    className="w-28 px-8 py-5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-center"
                    value={customItem.quantity}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <button 
                  onClick={addCustomItem}
                  className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95"
                >
                  Add to Order
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Final Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-10 overflow-y-auto no-scrollbar max-h-[70vh]">
                <div ref={receiptRef} className="bg-white text-gray-900 font-mono text-[11px] leading-relaxed">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{settings.cafeName}</h2>
                    <p className="opacity-60">{settings.address}</p>
                    <p className="opacity-60">Tel: {settings.phone}</p>
                  </div>
                  
                  <div className="border-t border-b border-dashed border-gray-300 py-4 mb-8 space-y-1.5">
                    <div className="flex justify-between">
                      <span>ORDER: #{showReceipt.orderNumber}</span>
                      <span>{new Date(showReceipt.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>INVOICE: {showReceipt.receiptNumber}</span>
                      <span>{new Date(showReceipt.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CASHIER: {user?.displayName || "Admin"}</span>
                      <span>{showReceipt.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between font-black border-b border-dashed border-gray-100 pb-2">
                      <span className="flex-1">DESCRIPTION</span>
                      <span className="w-12 text-center">QTY</span>
                      <span className="w-24 text-right">TOTAL</span>
                    </div>
                    {showReceipt.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="flex-1 truncate pr-3">{item.name}</span>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <span className="w-24 text-right">{(item.quantity * item.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-4 space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span className="font-black">{settings.currency}{showReceipt.subtotal.toLocaleString()}</span>
                    </div>
                    {showReceipt.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>DISCOUNT</span>
                        <span className="font-black">-{settings.currency}{showReceipt.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TAX ({settings.taxRate}%)</span>
                      <span className="font-black">{settings.currency}{showReceipt.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SERVICE ({settings.serviceCharge}%)</span>
                      <span className="font-black">{settings.currency}{showReceipt.serviceCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black pt-6 border-t border-double border-gray-900 mt-4">
                      <span>TOTAL</span>
                      <span>{settings.currency}{showReceipt.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-10 text-center space-y-5">
                    <div className="inline-block p-5 border-2 border-dashed border-gray-100 rounded-[1.5rem] w-full bg-gray-50">
                      <div className="flex justify-between text-[9px] font-black text-gray-400 mb-2 uppercase tracking-widest">
                        <span>RECEIVED</span>
                        <span>CHANGE</span>
                      </div>
                      <div className="flex justify-between font-black text-red-600 text-lg">
                        <span>{settings.currency}{showReceipt.payments?.[0]?.received?.toLocaleString() || showReceipt.total.toLocaleString()}</span>
                        <span>{settings.currency}{showReceipt.payments?.[0]?.change?.toLocaleString() || "0"}</span>
                      </div>
                    </div>
                    <p className="opacity-60 italic text-[10px]">"Every cup tells a story. Thanks for being part of ours!"</p>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-gray-50 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-lg shadow-gray-200"
                  >
                    <Printer className="w-5 h-5" />
                    Print
                  </button>
                  <button 
                    onClick={downloadReceiptPDF}
                    className="py-5 bg-white border border-gray-200 text-gray-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                    PDF
                  </button>
                </div>
                <button 
                  onClick={() => setShowReceipt(null)}
                  className="w-full py-6 bg-red-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                >
                  Start New Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-content, .receipt-content * { visibility: visible; }
          .receipt-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
