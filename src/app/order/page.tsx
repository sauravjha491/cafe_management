"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight, Star, Heart, HeartOff, History, Loader2, Coffee, Sparkles, CheckCircle2 } from "lucide-react"; // Loader2 for status tracking
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useOrderHistoryStore } from "@/store/useOrderHistoryStore";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Settings {
  cafeName: string;
  currency: string;
  taxRate: number;
  serviceCharge: number;
}

function OrderContent() {
  const searchParams = useSearchParams();
  const table = searchParams.get("table") || "0";
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({
    cafeName: "CAFÉ MENU",
    currency: "Rs.",
    taxRate: 5.0,
    serviceCharge: 2.0,
  });

  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavoritesStore();
  const { orderIds, addOrderId } = useOrderHistoryStore();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        const catParam = searchParams.get("category");
        if (catParam === "favorites") {
          setSelectedCategory("favorites");
        } else if (data.length > 0) {
          setSelectedCategory(data[0].id);
        }
      });

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSettings(data);
      });
  }, []);

  const fetchHistory = async () => {
    if (orderIds.length === 0) return;
    const orders = await Promise.all(
      orderIds.map(id => fetch(`/api/orders?id=${id}`).then(res => res.json()))
    );
    setHistoryOrders(orders.filter(o => o !== null));
  };

  useEffect(() => {
    if (isHistoryOpen) fetchHistory();
  }, [isHistoryOpen]);

  const filteredProducts = selectedCategory === "favorites" 
    ? categories.flatMap(c => c.products).filter(p => isFavorite(p.id))
    : (selectedCategory === "" && categories.length > 0 ? categories[0].products : categories.find((c) => c.id === selectedCategory)?.products || [])
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const taxAmount = (getTotal() * settings.taxRate) / 100;
  const serviceChargeAmount = (getTotal() * settings.serviceCharge) / 100;
  const totalAmount = getTotal() + taxAmount + serviceChargeAmount;

  const handlePlaceOrder = async () => {
    if (!customerName) {
      toast.error("Please enter your name");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: table,
          customerName,
          items,
          total: totalAmount,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        addOrderId(order.id);
        setPlacedOrder(order);
        clearCart();
        // window.location.href = `/order/track/${order.id}`; // Removed for modal
      } else {
        throw new Error("Failed to place order");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-red-600 uppercase">{settings.cafeName}</h1>
          <span className="text-xs text-gray-500 font-medium">Table No: {table}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="relative p-2 bg-gray-100 rounded-full"
          >
            <History className="w-6 h-6 text-gray-700" />
          </button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-gray-100 rounded-full"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700" />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {items.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for food..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="overflow-x-auto no-scrollbar flex px-4 gap-2 pb-2">
        <button
          onClick={() => setSelectedCategory("favorites")}
          className={cn(
            "px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all flex items-center gap-2",
            selectedCategory === "favorites" 
              ? "bg-red-600 text-white shadow-lg shadow-red-200" 
              : "bg-white text-gray-600 border border-gray-200"
          )}
        >
          <Heart className={cn("w-4 h-4", selectedCategory === "favorites" ? "fill-white" : "")} />
          Favorites
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all",
              selectedCategory === cat.id 
                ? "bg-red-600 text-white shadow-lg shadow-red-200" 
                : "bg-white text-gray-600 border border-gray-200"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Featured Section */}
      {selectedCategory !== "favorites" && searchQuery === "" && categories.flatMap(c => c.products).filter(p => p.featured).length > 0 && (
        <div className="py-6">
          <div className="px-4 mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              Chef's Special
            </h2>
          </div>
          <div className="overflow-x-auto no-scrollbar flex gap-4 px-4 pb-4">
            {categories.flatMap(c => c.products).filter(p => p.featured).map((product) => (
              <motion.div
                key={`featured-${product.id}`}
                whileTap={{ scale: 0.98 }}
                className="min-w-[280px] bg-white rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col"
              >
                <div className="relative h-40">
                  <Image src={product.image} alt={product.name} fill className="object-cover" />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <button 
                    onClick={() => {
                      const wasFavorite = isFavorite(product.id);
                      toggleFavorite(product.id);
                      toast.success(wasFavorite ? "Removed from favorites" : "Added to favorites");
                    }}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all z-10"
                  >
                    <Heart className={cn("w-5 h-5 transition-colors", isFavorite(product.id) ? "fill-red-600 text-red-600" : "text-gray-400")} />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-black text-red-600">{settings.currency} {product.price.toLocaleString()}</span>
                    <button 
                      onClick={() => {
                        addItem(product);
                        toast.success(`Added ${product.name}`);
                      }}
                      className="bg-red-600 text-white p-2 rounded-xl shadow-lg shadow-red-100 active:scale-90 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <Coffee className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold text-lg">Menu is being prepared...</p>
            <p className="text-sm mt-1">Please check back in a moment.</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 w-full">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.featured && (
                  <div className="absolute top-3 left-3 bg-yellow-400 text-xs font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    FEATURED
                  </div>
                )}
                <button 
                  onClick={() => {
                    const wasFavorite = isFavorite(product.id);
                    toggleFavorite(product.id);
                    toast.success(wasFavorite ? "Removed from favorites" : "Added to favorites");
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all z-10"
                >
                  <Heart className={cn("w-5 h-5 transition-colors", isFavorite(product.id) ? "fill-red-600 text-red-600" : "text-gray-400")} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 text-lg">{product.name}</h3>
                  <span className="font-bold text-red-600">{settings.currency} {product.price.toLocaleString()}</span>
                </div>
                <p className="text-gray-500 text-xs line-clamp-2 mb-4">{product.description}</p>
                <button
                  onClick={() => {
                    addItem(product);
                    toast.success(`Added ${product.name}`);
                  }}
                  className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  ADD TO CART
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-6 h-6" /> Your History
                </h2>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {historyOrders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <History className="w-16 h-16 mb-4 opacity-20" />
                    <p>No recent orders found</p>
                  </div>
                ) : (
                  historyOrders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => window.location.href = `/order/track/${order.id}`}
                      className="bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-red-100 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-black text-lg">#{order.orderNumber}</span>
                        <span className="px-2 py-1 bg-white rounded-lg text-[10px] font-black uppercase tracking-widest text-red-600 border border-red-50">
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                        <span className="font-black text-gray-900">{settings.currency} {order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" /> Your Cart
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 bg-gray-50 p-4 rounded-2xl">
                      <div className="flex gap-4">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <Image src={item.image || ""} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-800">{item.name}</h4>
                            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600">
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-red-600 font-bold text-sm">{settings.currency} {item.price.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 bg-white p-1 rounded-full border">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Add note (e.g. Less sugar)"
                          className="flex-1 bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-red-500/20 outline-none font-medium"
                          value={item.note || ""}
                          onChange={(e) => {
                            useCartStore.setState((state) => ({
                              items: state.items.map((i) =>
                                i.id === item.id ? { ...i, note: e.target.value } : i
                              ),
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t bg-white space-y-4">
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">{settings.currency} {getTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax ({settings.taxRate}%)</span>
                    <span className="font-bold text-gray-900">{settings.currency} {taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Service Charge ({settings.serviceCharge}%)</span>
                    <span className="font-bold text-gray-900">{settings.currency} {serviceChargeAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center text-lg font-black text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-red-600 text-2xl">{settings.currency} {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Enter Your Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <button
                  disabled={isPlacingOrder || items.length === 0}
                  onClick={handlePlaceOrder}
                  className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-red-200 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sticky Cart Bar (Mobile) */}
      {items.length > 0 && !isCartOpen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-4 right-4 z-40"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-2xl flex items-center justify-between shadow-xl shadow-red-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-xs opacity-80 font-medium">{items.length} items</p>
                <p className="font-bold">View Cart</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80 font-medium">Total</p>
              <p className="font-bold text-lg">{settings.currency} {getTotal().toLocaleString()}</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Order Success Modal */}
      <AnimatePresence>
        {placedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-4 m-auto h-fit max-w-sm bg-white z-[70] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="bg-red-600 p-8 text-center relative overflow-hidden">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative z-10"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-black text-white relative z-10">Order Placed!</h2>
                <p className="text-white/80 font-bold relative z-10">Order #{placedOrder.orderNumber}</p>
                
                {/* Decorative particles */}
                <Sparkles className="absolute -top-2 -left-2 w-12 h-12 text-white/10" />
                <Sparkles className="absolute -bottom-2 -right-2 w-16 h-16 text-white/10" />
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>Order Details</span>
                  <span className="text-gray-900">Table {placedOrder.tableNumber}</span>
                </div>

                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                  {placedOrder.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className="font-black text-red-600">{item.quantity}x</span>
                        <span className="font-bold text-gray-800 text-sm">{item.product?.name || "Item"}</span>
                      </div>
                      <span className="font-bold text-gray-400 text-sm">{settings.currency} {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-dashed flex justify-between items-center">
                  <span className="font-black text-gray-900">Total Paid</span>
                  <span className="text-2xl font-black text-red-600">{settings.currency} {placedOrder.total.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => window.location.href = `/order/track/${placedOrder.id}`}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-gray-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  Track My Order
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <OrderContent />
    </Suspense>
  );
}
