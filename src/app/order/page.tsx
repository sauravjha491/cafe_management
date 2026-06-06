"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Search, Plus, Minus, X, ChevronRight, Star, Heart, HeartOff, History, Loader2 } from "lucide-react"; // Loader2 for status tracking
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

  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavoritesStore();
  const { orderIds, addOrderId } = useOrderHistoryStore();

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].id);
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
    : categories
        .find((c) => c.id === selectedCategory)
        ?.products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];

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
          total: getTotal() * 1.07,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        addOrderId(order.id);
        toast.success("Order placed successfully!");
        clearCart();
        window.location.href = `/order/track/${order.id}`;
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
          <h1 className="text-xl font-bold text-red-600">CAFÉ MENU</h1>
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

      {/* Product List */}
      <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
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
                  toggleFavorite(product.id);
                  toast.success(isFavorite(product.id) ? "Removed from favorites" : "Added to favorites");
                }}
                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all"
              >
                <Heart className={cn("w-5 h-5 transition-colors", isFavorite(product.id) ? "fill-red-600 text-red-600" : "text-gray-400")} />
              </button>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-gray-800 text-lg">{product.name}</h3>
                <span className="font-bold text-red-600">${product.price.toFixed(2)}</span>
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
        ))}
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
                        <span className="font-black text-gray-900">${order.total.toFixed(2)}</span>
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
                          <p className="text-red-600 font-bold text-sm">${item.price.toFixed(2)}</p>
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
                    <span className="font-bold text-gray-900">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Tax (5%)</span>
                    <span className="font-bold text-gray-900">${(getTotal() * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Service Charge (2%)</span>
                    <span className="font-bold text-gray-900">${(getTotal() * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center text-lg font-black text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-red-600 text-2xl">${(getTotal() * 1.07).toFixed(2)}</span>
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
              <p className="font-bold text-lg">${getTotal().toFixed(2)}</p>
            </div>
          </button>
        </motion.div>
      )}
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
