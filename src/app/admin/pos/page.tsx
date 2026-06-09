"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Minus, X, 
  ShoppingCart, User, CreditCard, 
  Banknote, Wallet, QrCode, 
  Printer, Trash2, Pause, Play,
  ChevronRight, Loader2, Sparkles,
  UserPlus, Info, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

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

interface CartItem extends Product {
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldOrders, setHeldOrders] = useState<{id: string, cart: CartItem[], customer: Customer | null}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "QR" | "WALLET">("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [settings, setSettings] = useState({
    currency: "Rs.",
    taxRate: 5.0,
    cafeName: "CafePro",
    address: "123 Cafe Street",
    phone: "1234567890"
  });

  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch data
    Promise.all([
      fetch("/api/admin/products").then(res => res.json()),
      fetch("/api/categories").then(res => res.json()),
      fetch("/api/admin/settings").then(res => res.json())
    ]).then(([productsData, categoriesData, settingsData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
      if (!settingsData.error) setSettings(settingsData);
    });
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = (subtotal * settings.taxRate) / 100;
  const total = subtotal + tax;

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    const newHold = {
      id: Math.random().toString(36).substr(2, 9),
      cart: [...cart],
      customer: selectedCustomer
    };
    setHeldOrders(prev => [...prev, newHold]);
    setCart([]);
    setSelectedCustomer(null);
    toast.success("Order put on hold");
  };

  const handleResumeOrder = (holdId: string) => {
    const held = heldOrders.find(h => h.id === holdId);
    if (held) {
      if (cart.length > 0) {
        handleHoldOrder(); // Hold current if any
      }
      setCart(held.cart);
      setSelectedCustomer(held.customer);
      setHeldOrders(prev => prev.filter(h => h.id !== holdId));
      toast.success("Order resumed");
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be an API call
    const mockCustomer = { ...newCustomer, id: Math.random().toString() };
    setSelectedCustomer(mockCustomer);
    setShowCustomerModal(false);
    setNewCustomer({ name: "", phone: "" });
    toast.success("Customer added");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "POS",
          customerName: selectedCustomer?.name || "Walk-in Customer",
          phoneNumber: selectedCustomer?.phone,
          items: cart,
          subtotal,
          tax,
          total,
          paymentMethod,
        })
      });

      if (res.ok) {
        const order = await res.json();
        setShowReceipt(order);
        setCart([]);
        setSelectedCustomer(null);
        toast.success("Order completed!");
      } else {
        throw new Error("Checkout failed");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-120px)] gap-6 overflow-hidden relative">
      <Toaster position="top-right" />
      
      {/* Mobile Cart Toggle */}
      <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Your Cart</p>
            <p className="font-black text-gray-900 text-sm">{cart.length} Items • {settings.currency}{total.toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowCartMobile(true)}
          className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200"
        >
          View Cart
        </button>
      </div>
      
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0 overflow-hidden">
        {/* Search & Categories */}
        <div className="bg-white p-4 lg:p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-4 lg:space-y-6 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 lg:py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all text-sm lg:text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-5 lg:px-6 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-black whitespace-nowrap transition-all uppercase tracking-widest",
                selectedCategory === "all" ? "bg-gray-900 text-white shadow-lg" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-5 lg:px-6 py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-black whitespace-nowrap transition-all uppercase tracking-widest",
                  selectedCategory === cat.id ? "bg-gray-900 text-white shadow-lg" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4 pb-4 px-1">
          {filteredProducts.map(product => (
            <motion.button
              key={product.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(product)}
              className="bg-white p-3 lg:p-4 rounded-[1.5rem] lg:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all text-left flex flex-col group relative overflow-hidden h-fit"
            >
              <div className="relative h-24 lg:h-32 w-full rounded-xl lg:rounded-2xl overflow-hidden mb-3 lg:mb-4 shrink-0">
                <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                {product.stock >= 0 && (
                  <div className={cn(
                    "absolute top-2 right-2 px-2 py-1 rounded-lg text-[8px] lg:text-[10px] font-black uppercase",
                    product.stock > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {product.stock > 0 ? `${product.stock} left` : "Out of Stock"}
                  </div>
                )}
              </div>
              <h4 className="font-black text-gray-900 text-xs lg:text-sm line-clamp-1 mb-1">{product.name}</h4>
              <p className="mt-auto font-black text-red-600 text-xs lg:text-sm">{settings.currency} {product.price.toLocaleString()}</p>
              
              <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-red-600 text-white p-2 rounded-full shadow-lg">
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Right: Cart & Checkout (Desktop & Mobile Slide-over) */}
      <AnimatePresence>
        {(showCartMobile || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <>
            {/* Mobile Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartMobile(false)}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 right-0 z-[70] w-full max-w-[400px] bg-white lg:relative lg:z-0 lg:w-[400px] lg:rounded-[2.5rem] lg:shadow-2xl border-l lg:border border-gray-100 flex flex-col shadow-2xl",
                !showCartMobile && "hidden lg:flex"
              )}
            >
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-50">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Current Cart</h3>
                <button onClick={() => setShowCartMobile(false)} className="p-2 bg-gray-50 rounded-xl">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Customer Section */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Customer</p>
                    <p className="font-black text-gray-900 text-sm">{selectedCustomer?.name || "Walk-in Customer"}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCustomerModal(true)}
                  className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p className="font-black uppercase tracking-widest text-xs">Cart is Empty</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-black text-gray-900 text-sm line-clamp-1">{item.name}</h5>
                          <button onClick={() => removeFromCart(item.id)} className="lg:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="font-black text-red-600 text-sm">{settings.currency} {(item.price * item.quantity).toLocaleString()}</p>
                          <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-xl">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-lg hover:bg-white flex items-center justify-center transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Actions Bar */}
              <div className="p-4 border-t border-gray-50 flex gap-2">
                <button 
                  onClick={() => setCart([])}
                  disabled={cart.length === 0}
                  className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mx-auto mb-1" />
                  Clear
                </button>
                <button 
                  onClick={handleHoldOrder}
                  disabled={cart.length === 0}
                  className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all disabled:opacity-50"
                >
                  <Pause className="w-4 h-4 mx-auto mb-1" />
                  Hold
                </button>
                <div className="relative group">
                  <button 
                    className="px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-900 transition-all"
                  >
                    <div className="relative">
                      <Play className="w-4 h-4 mx-auto mb-1" />
                      {heldOrders.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white" />
                      )}
                    </div>
                    Resume
                  </button>
                  
                  {/* Held Orders Popover */}
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-10">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Held Orders ({heldOrders.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                      {heldOrders.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">No held orders</p>
                      ) : (
                        heldOrders.map(hold => (
                          <button 
                            key={hold.id}
                            onClick={() => handleResumeOrder(hold.id)}
                            className="w-full text-left p-3 rounded-2xl bg-gray-50 hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            <p className="text-xs font-black">{hold.customer?.name || "Walk-in Customer"}</p>
                            <p className="text-[10px] opacity-60">{hold.cart.length} items • {settings.currency} {hold.cart.reduce((a, b) => a + b.price * b.quantity, 0).toLocaleString()}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Totals & Checkout */}
              <div className="p-6 bg-gray-50 lg:rounded-b-[2.5rem] space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>SUBTOTAL</span>
                    <span className="text-gray-900">{settings.currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>TAX ({settings.taxRate}%)</span>
                    <span className="text-gray-900">{settings.currency} {tax.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-black text-gray-900">GRAND TOTAL</span>
                    <span className="text-2xl font-black text-red-600">{settings.currency} {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "CASH", icon: Banknote },
                    { id: "CARD", icon: CreditCard },
                    { id: "QR", icon: QrCode },
                    { id: "WALLET", icon: Wallet }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={cn(
                        "py-3 rounded-2xl flex items-center justify-center transition-all",
                        paymentMethod === m.id ? "bg-gray-900 text-white shadow-lg" : "bg-white text-gray-400 border border-gray-200"
                      )}
                    >
                      <m.icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>

                <button
                  disabled={isProcessing || cart.length === 0}
                  onClick={handleCheckout}
                  className="w-full py-5 bg-red-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      Complete Order
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  <UserPlus className="w-8 h-8 text-red-600" />
                  Add Customer
                </h3>
                <form onSubmit={handleAddCustomer} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Customer Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      required
                      type="tel"
                      placeholder="e.g. 9800000000"
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none font-bold transition-all"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 mt-4"
                  >
                    Select Customer
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div ref={receiptRef} className="p-8 bg-white text-gray-900 font-mono text-sm print:p-0">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black uppercase tracking-tighter mb-1">{settings.cafeName}</h2>
                  <p className="text-[10px] opacity-60">{settings.address}</p>
                  <p className="text-[10px] opacity-60">Tel: {settings.phone}</p>
                </div>
                
                <div className="border-t border-b border-dashed py-3 mb-6 space-y-1">
                  <div className="flex justify-between">
                    <span>Order: #{showReceipt.orderNumber}</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staff: {showReceipt.staffId || "Admin"}</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {showReceipt.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-bold">{item.product?.name || item.name}</p>
                        <p className="text-[10px] opacity-60">{item.quantity} x {settings.currency} {item.price}</p>
                      </div>
                      <span className="font-bold">{settings.currency} {(item.quantity * item.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{settings.currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({settings.taxRate}%)</span>
                    <span>{settings.currency} {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-2">
                    <span>TOTAL</span>
                    <span>{settings.currency} {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <div className="inline-block p-4 border-2 border-dashed border-gray-100 rounded-2xl mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">Payment Method</p>
                    <p className="font-black text-red-600">{paymentMethod}</p>
                  </div>
                  <p className="text-[10px] opacity-60">Thank you for your visit!</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 flex gap-3">
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button 
                  onClick={() => setShowReceipt(null)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
