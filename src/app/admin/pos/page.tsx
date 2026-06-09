"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryId: string;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  id: string; // Unique for each line item (can be product id or random for custom)
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
  discount?: number;
  image?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export default function POSPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
  const [cashReceived, setCashReceived] = useState<string>("");
  
  // Feature States
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "QR" | "WALLET">("CASH");
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [customItem, setCustomItem] = useState({ name: "", price: "", quantity: "1" });
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
    fetchData();
    fetchHeldOrders();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, categoriesData, settingsData] = await Promise.all([
        fetch("/api/admin/products").then(res => res.json()),
        fetch("/api/categories").then(res => res.json()),
        fetch("/api/admin/settings").then(res => res.json())
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      if (settingsData && !settingsData.error) setSettings(settingsData);
    } catch (e) {
      toast.error("Failed to fetch initial data");
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
        image: product.image
      }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
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
          staffId: user?.uid || "admin",
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
          staffId: user?.uid || "admin",
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

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-full bg-gray-50/50 gap-0 lg:gap-6 overflow-hidden relative">
      <Toaster position="top-right" />
      
      {/* --- LEFT SIDE: PRODUCTS --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white lg:bg-transparent">
        {/* Search & Mobile Toggle */}
        <div className="p-4 lg:p-0 flex items-center gap-4 shrink-0">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search products or scan barcode..."
              className="w-full pl-12 pr-4 py-4 bg-white lg:bg-white border border-gray-100 lg:border-transparent rounded-2xl shadow-sm lg:shadow-md focus:ring-2 focus:ring-red-500/10 outline-none font-bold transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowCartMobile(true)}
            className="lg:hidden relative p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200"
          >
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 border-2 border-white text-[10px] font-black rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* Categories Bar */}
        <div className="px-4 lg:px-0 py-4 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "px-6 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest flex items-center gap-2",
              selectedCategory === "all" ? "bg-gray-900 text-white shadow-xl scale-105" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            )}
          >
            <Package className="w-4 h-4" />
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest",
                selectedCategory === cat.id ? "bg-gray-900 text-white shadow-xl scale-105" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 p-4 lg:p-0 pb-20 lg:pb-6">
          {filteredProducts.map(product => (
            <motion.button
              key={product.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(product)}
              className="bg-white p-3 lg:p-4 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-red-900/5 transition-all text-left flex flex-col group relative overflow-hidden h-fit"
            >
              <div className="relative h-28 lg:h-36 w-full rounded-2xl overflow-hidden mb-3 lg:mb-4">
                <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {product.stock >= 0 && (
                  <div className={cn(
                    "absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                    product.stock > 0 ? (product.stock < 10 ? "bg-orange-500 text-white" : "bg-green-500 text-white") : "bg-red-500 text-white"
                  )}>
                    {product.stock > 0 ? `${product.stock} In Stock` : "Out of Stock"}
                  </div>
                )}
              </div>
              <h4 className="font-black text-gray-900 text-sm line-clamp-2 leading-tight mb-2 h-10">{product.name}</h4>
              <div className="mt-auto flex items-center justify-between">
                <p className="font-black text-red-600 text-lg">{settings.currency}{product.price.toLocaleString()}</p>
                <div className="bg-gray-50 p-2 rounded-xl text-gray-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* --- RIGHT SIDE: CART & CHECKOUT --- */}
      <AnimatePresence>
        {(showCartMobile || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartMobile(false)}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 right-0 z-[70] w-full max-w-[420px] bg-white lg:relative lg:z-0 lg:w-[420px] lg:rounded-[2.5rem] lg:shadow-2xl border-l lg:border border-gray-100 flex flex-col shadow-2xl overflow-hidden",
                !showCartMobile && "hidden lg:flex"
              )}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Current Order</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">
                      {cart.reduce((a, b) => a + b.quantity, 0)} Items Selected
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowHeldOrdersModal(true)}
                    className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
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
                    className="lg:hidden p-3 bg-gray-50 text-gray-400 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Customer Selector */}
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Customer</p>
                    <p className="font-black text-gray-900 text-sm truncate">
                      {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {selectedCustomer && (
                    <button 
                      onClick={() => setSelectedCustomer(null)}
                      className="p-2.5 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => setShowCustomerModal(true)}
                    className="p-2.5 bg-white text-gray-400 hover:text-red-600 rounded-xl shadow-sm transition-all active:scale-95"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-200 py-12">
                    <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-6">
                      <Package className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="font-black uppercase tracking-widest text-[10px]">Your cart is empty</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-2">Add items to start an order</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cart.map(item => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={item.id} 
                        className="flex gap-4 group bg-white"
                      >
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-gray-50">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Sparkles className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="font-black text-gray-900 text-sm line-clamp-1 flex-1">{item.name}</h5>
                            <button 
                              onClick={() => updateQuantity(item.id, -item.quantity)} 
                              className="text-gray-300 hover:text-red-600 transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <input 
                              type="text"
                              placeholder="Add a note..."
                              className="text-[10px] font-bold text-gray-400 bg-transparent outline-none w-full border-b border-transparent focus:border-gray-100 pb-0.5 italic"
                              value={item.note || ""}
                              onChange={(e) => updateItemNote(item.id, e.target.value)}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-black text-red-600 text-base">{settings.currency}{(item.price * item.quantity).toLocaleString()}</p>
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)} 
                                className="w-8 h-8 rounded-lg bg-white text-gray-400 hover:text-red-600 shadow-sm flex items-center justify-center transition-all"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black w-8 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)} 
                                className="w-8 h-8 rounded-lg bg-white text-gray-400 hover:text-red-600 shadow-sm flex items-center justify-center transition-all"
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

              {/* Bottom Actions & Summary */}
              <div className="shrink-0 bg-white">
                {/* Custom Actions */}
                <div className="px-6 py-4 grid grid-cols-4 gap-3 border-t border-gray-50">
                  <button 
                    onClick={() => setShowCustomItemModal(true)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Custom</span>
                  </button>
                  <button 
                    onClick={() => setShowDiscountModal(true)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all group"
                  >
                    <Tag className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Discount</span>
                  </button>
                  <button 
                    onClick={handleHoldOrder}
                    disabled={cart.length === 0 || isProcessing}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all group disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pause className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="text-[8px] font-black uppercase tracking-widest">Hold</span>
                  </button>
                  <button 
                    onClick={() => setCart([])}
                    disabled={cart.length === 0}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all group disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Clear</span>
                  </button>
                </div>

                {/* Totals Section */}
                <div className="p-6 lg:p-8 bg-gray-900 text-white lg:rounded-t-[3rem] space-y-6">
                  <div className="space-y-3 opacity-90">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-white font-mono">{settings.currency}{subtotal.toLocaleString()}</span>
                    </div>
                    {globalDiscount > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
                        <span>Discount ({globalDiscount}%)</span>
                        <span className="font-mono">-{settings.currency}{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>Tax ({settings.taxRate}%)</span>
                      <span className="text-white font-mono">{settings.currency}{tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <span>Service ({settings.serviceCharge}%)</span>
                      <span className="text-white font-mono">{settings.currency}{serviceCharge.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Grand Total</p>
                      <h2 className="text-4xl font-black tracking-tighter text-white leading-none">
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
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2",
                            paymentMethod === m.id ? "bg-red-600 border-red-500 shadow-lg shadow-red-600/20" : "bg-white/5 border-transparent text-slate-400"
                          )}
                        >
                          <m.icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Inputs */}
                  {paymentMethod === "CASH" && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="pt-4 flex gap-4"
                    >
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cash Received</p>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xl font-black text-white outline-none focus:border-red-500 transition-all font-mono"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Change Due</p>
                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xl font-black text-green-400 font-mono">
                          {settings.currency}{change.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <button
                    disabled={isProcessing || cart.length === 0 || (paymentMethod === "CASH" && (!cashReceived || parseFloat(cashReceived) < total))}
                    onClick={handleCheckout}
                    className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-red-600/30 hover:bg-red-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                  >
                    {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                      <>
                        Complete Payment
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-5 h-5" />
                        </div>
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
      
      {/* Customer Selection Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Select Customer</h3>
                </div>
                <button onClick={() => setShowCustomerModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                {/* New Customer Form */}
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Quick Add New Customer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text"
                      placeholder="Full Name"
                      className="px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-sm"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <input 
                      type="tel"
                      placeholder="Phone Number"
                      className="px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-sm"
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
                    className="w-full mt-4 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95"
                  >
                    Add & Select Customer
                  </button>
                </section>

                {/* Existing Customer Search */}
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">Search Existing Customers</h4>
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text"
                      placeholder="Search by name or phone..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-sm"
                      onChange={async (e) => {
                        if (e.target.value.length < 2) return;
                        const res = await fetch(`/api/pos/customers?query=${e.target.value}`);
                        // Handle results in state...
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
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Pause className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Held Orders</h3>
                </div>
                <button onClick={() => setShowHeldOrdersModal(false)} className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
                {heldOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-gray-300 font-black uppercase tracking-widest text-xs">No orders on hold</p>
                  </div>
                ) : (
                  heldOrders.map((order) => (
                    <div key={order.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Draft</span>
                          <p className="font-black text-gray-900">{order.customerName || "Walk-in Customer"}</p>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {order.items.length} items • {settings.currency}{order.total.toLocaleString()} • {new Date(order.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => resumeOrder(order)}
                        className="p-4 bg-white text-blue-600 rounded-2xl shadow-sm border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-current" />
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
              className="relative w-full max-w-xs bg-white rounded-[2.5rem] shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Tag className="w-6 h-6 text-red-600" />
                Apply Discount
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[0, 5, 10, 15, 20, 25, 30, 50, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      setGlobalDiscount(val);
                      setShowDiscountModal(false);
                      toast.success(`${val}% discount applied`);
                    }}
                    className={cn(
                      "py-3 rounded-xl font-black text-xs transition-all",
                      globalDiscount === val ? "bg-red-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {val}%
                  </button>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="number"
                  placeholder="Custom %"
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-center"
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
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-red-600" />
                Add Custom Item
              </h3>
              <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="Item Name (e.g. Special Cake)"
                  className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                  value={customItem.name}
                  onChange={(e) => setCustomItem(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className="flex gap-4">
                  <input 
                    type="number"
                    placeholder="Price"
                    className="flex-1 px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                    value={customItem.price}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, price: e.target.value }))}
                  />
                  <input 
                    type="number"
                    placeholder="Qty"
                    className="w-24 px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-center"
                    value={customItem.quantity}
                    onChange={(e) => setCustomItem(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <button 
                  onClick={addCustomItem}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
                >
                  Add to Cart
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
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 overflow-y-auto no-scrollbar max-h-[70vh]">
                <div ref={receiptRef} className="bg-white text-gray-900 font-mono text-[10px] leading-relaxed">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-1">{settings.cafeName}</h2>
                    <p className="opacity-60">{settings.address}</p>
                    <p className="opacity-60">Tel: {settings.phone}</p>
                  </div>
                  
                  <div className="border-t border-b border-dashed border-gray-300 py-3 mb-6 space-y-1">
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

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between font-black border-b border-dashed border-gray-100 pb-1">
                      <span className="flex-1">ITEM</span>
                      <span className="w-12 text-center">QTY</span>
                      <span className="w-20 text-right">TOTAL</span>
                    </div>
                    {showReceipt.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="flex-1 truncate pr-2">{item.name}</span>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <span className="w-20 text-right">{(item.quantity * item.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-[11px]">
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
                    <div className="flex justify-between text-lg font-black pt-4 border-t border-double border-gray-900 mt-2">
                      <span>TOTAL</span>
                      <span>{settings.currency}{showReceipt.total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-8 text-center space-y-4">
                    <div className="inline-block p-4 border-2 border-dashed border-gray-100 rounded-2xl w-full">
                      <div className="flex justify-between text-[8px] font-black text-gray-400 mb-1">
                        <span>RECEIVED</span>
                        <span>CHANGE</span>
                      </div>
                      <div className="flex justify-between font-black text-red-600 text-sm">
                        <span>{settings.currency}{showReceipt.payments?.[0]?.received?.toLocaleString() || showReceipt.total.toLocaleString()}</span>
                        <span>{settings.currency}{showReceipt.payments?.[0]?.change?.toLocaleString() || "0"}</span>
                      </div>
                    </div>
                    <p className="opacity-60 italic text-[9px]">"Every sip tells a story. Thanks for being part of ours!"</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => window.print()}
                    className="py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button 
                    onClick={downloadReceiptPDF}
                    className="py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
                <button 
                  onClick={() => setShowReceipt(null)}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-red-200"
                >
                  New Order
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
