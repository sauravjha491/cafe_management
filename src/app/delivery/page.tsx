"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, Search, Plus, Minus, X, 
  ChevronRight, Star, Heart, History, 
  Loader2, Coffee, Sparkles, CheckCircle2,
  MapPin, Phone, User, Notebook,
  Navigation, CreditCard, Wallet, Banknote,
  Info
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { useOrderHistoryStore } from "@/store/useOrderHistoryStore";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

// Dynamic import for Map component to avoid SSR issues
const MapSelector = dynamic(() => import('@/components/MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center">Loading Map...</div>
});

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
  deliveryFeePerKm: number;
  address: string;
}

function DeliveryContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  
  // Checkout States
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "WALLET">("CASH");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const [settings, setSettings] = useState<Settings>({
    cafeName: "CAFÉ MENU",
    currency: "Rs.",
    taxRate: 5.0,
    serviceCharge: 0,
    deliveryFeePerKm: 10,
    address: "123 Cafe Street",
  });

  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  const { favoriteIds, toggleFavorite, isFavorite } = useFavoritesStore();
  const { addOrderId } = useOrderHistoryStore();

  // Cafe Location (Hardcoded for now, should ideally be in settings)
  const CAFE_LOCATION = { lat: 27.7172, lng: 85.3240 }; // Example: Kathmandu

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0].id);
      });

    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSettings(data);
      });
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (location) {
      const dist = calculateDistance(CAFE_LOCATION.lat, CAFE_LOCATION.lng, location.lat, location.lng);
      setDistance(parseFloat(dist.toFixed(2)));
    }
  }, [location]);

  const filteredProducts = selectedCategory === "favorites" 
    ? categories.flatMap(c => c.products).filter(p => isFavorite(p.id))
    : (categories.find((c) => c.id === selectedCategory)?.products || [])
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const subtotal = getTotal();
  const taxAmount = (subtotal * settings.taxRate) / 100;
  const deliveryFee = distance * settings.deliveryFeePerKm;
  const totalAmount = subtotal + taxAmount + deliveryFee - discount;

  const handleLocationSelect = (lat: number, lng: number) => {
    setLocation({ lat, lng });
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        toast.success("Location detected!");
      }, () => {
        toast.error("Failed to detect location. Please select manually.");
      });
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerName || !phoneNumber || !address || !location) {
      toast.error("Please fill in all delivery details");
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
          type: "DELIVERY",
          customerName,
          phoneNumber,
          address,
          latitude: location.lat,
          longitude: location.lng,
          notes,
          items,
          subtotal,
          tax: taxAmount,
          deliveryFee,
          discount,
          total: totalAmount,
          paymentMethod,
        }),
      });

      if (res.ok) {
        const order = await res.json();
        addOrderId(order.id);
        setPlacedOrder(order);
        clearCart();
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to place order");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-red-600 uppercase tracking-tighter">{settings.cafeName}</h1>
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Home Delivery</span>
          </div>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-200"
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          {items.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-black shadow-sm">
              {items.length}
            </span>
          )}
        </button>
      </header>

      {/* Hero Search */}
      <div className="p-6 bg-white border-b border-gray-100">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-red-600 transition-colors" />
          <input
            type="text"
            placeholder="Search for dishes, drinks..."
            className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent rounded-[2rem] focus:outline-none focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-500/5 font-bold text-lg transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[89px] z-20 bg-white/80 backdrop-blur-md py-4 border-b border-gray-100">
        <div className="overflow-x-auto no-scrollbar flex px-6 gap-3">
          <button
            onClick={() => setSelectedCategory("favorites")}
            className={cn(
              "px-6 py-3 rounded-2xl whitespace-nowrap text-sm font-black transition-all flex items-center gap-2 uppercase tracking-widest",
              selectedCategory === "favorites" 
                ? "bg-red-600 text-white shadow-xl shadow-red-200" 
                : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
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
                "px-6 py-3 rounded-2xl whitespace-nowrap text-sm font-black transition-all uppercase tracking-widest",
                selectedCategory === cat.id 
                  ? "bg-red-600 text-white shadow-xl shadow-red-200" 
                  : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-gray-300">
            <Coffee className="w-20 h-20 mb-6 opacity-10" />
            <p className="font-black text-2xl uppercase tracking-tighter">No items found</p>
            <p className="text-sm font-bold mt-2">Try searching for something else</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={product.id}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-gray-200 transition-all group"
            >
              <div className="relative h-64 w-full overflow-hidden">
                <Image 
                  src={product.image} 
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <button 
                  onClick={() => {
                    const wasFavorite = isFavorite(product.id);
                    toggleFavorite(product.id);
                    toast.success(wasFavorite ? "Removed from favorites" : "Added to favorites");
                  }}
                  className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all z-10"
                >
                  <Heart className={cn("w-6 h-6 transition-colors", isFavorite(product.id) ? "fill-red-600 text-red-600" : "text-gray-400")} />
                </button>

                {product.featured && (
                  <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xl">
                    <Sparkles className="w-3 h-3 fill-current" />
                    CHEF'S PICK
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-900 text-xl tracking-tight mb-1">{product.name}</h3>
                    <p className="text-gray-500 text-xs font-medium line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                  <span className="font-black text-red-600 text-lg whitespace-nowrap">{settings.currency} {product.price.toLocaleString()}</span>
                </div>
                
                <button
                  onClick={() => {
                    addItem(product);
                    toast.success(`Added ${product.name}`);
                  }}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  ADD TO BASKET
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Checkout Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Checkout</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {/* Cart Items */}
                <section>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Order Items</h3>
                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <div className="py-12 bg-gray-50 rounded-[2rem] flex flex-col items-center justify-center text-gray-400">
                        <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold">Your basket is empty</p>
                      </div>
                    ) : (
                      items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-4 bg-gray-50 p-5 rounded-[2rem] border border-transparent hover:border-red-100 transition-all">
                          <div className="flex gap-5">
                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                              <Image src={item.image || ""} alt={item.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-black text-gray-900 tracking-tight">{item.name}</h4>
                                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              <p className="text-red-600 font-black">{settings.currency} {item.price.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl shadow-sm">
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black text-lg w-6 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="flex-1 relative">
                              <Notebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Any special requests?"
                                className="w-full bg-white border border-transparent rounded-2xl pl-10 pr-4 py-3 text-xs focus:ring-4 focus:ring-red-500/5 focus:border-red-100 outline-none font-bold shadow-sm transition-all"
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
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Delivery Information */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Delivery Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Your Name"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-500/5 outline-none font-bold transition-all"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Contact Number"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-500/5 outline-none font-bold transition-all"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Flat, Street, Area"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-500/5 outline-none font-bold transition-all"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-[2.5rem] p-4 space-y-4 border border-gray-100">
                      <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-black text-gray-900 flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-red-600" />
                          Pin Location
                        </span>
                        <button 
                          onClick={detectLocation}
                          className="text-xs font-black text-red-600 uppercase tracking-widest hover:underline"
                        >
                          Detect My GPS
                        </button>
                      </div>
                      <div className="h-64 rounded-3xl overflow-hidden border-4 border-white shadow-inner">
                        <MapSelector 
                          onLocationSelect={handleLocationSelect} 
                          initialLocation={location || CAFE_LOCATION}
                        />
                      </div>
                      {distance > 0 && (
                        <div className="flex items-center gap-3 px-2 py-1">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Info className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-gray-500">
                            Delivery distance is <span className="text-gray-900">{distance} km</span>. 
                            Estimated fee: <span className="text-red-600 font-black">{settings.currency} {deliveryFee.toFixed(2)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Payment & Promo */}
                <section className="space-y-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Payment Method</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "CASH", label: "Cash", icon: Banknote },
                      { id: "CARD", label: "Card", icon: CreditCard },
                      { id: "WALLET", label: "Wallet", icon: Wallet }
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPaymentMethod(p.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all",
                          paymentMethod === p.id 
                            ? "bg-red-50 border-red-600 text-red-600" 
                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                        )}
                      >
                        <p.icon className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promo Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        className="flex-1 px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 focus:ring-4 focus:ring-red-500/5 outline-none font-black uppercase transition-all"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <button className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black active:scale-95 transition-all">
                        Apply
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Order Summary Footer */}
              <div className="p-6 border-t bg-white space-y-6 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.1)]">
                <div className="space-y-3 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Subtotal</span>
                    <span className="text-gray-900">{settings.currency} {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400 uppercase tracking-widest">Delivery Fee</span>
                    <span className="text-gray-900">{settings.currency} {deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-gray-400 uppercase tracking-widest text-red-600">Discount</span>
                    <span className="text-red-600">- {settings.currency} {discount.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-dashed flex justify-between items-center">
                    <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Grand Total</span>
                    <span className="text-3xl font-black text-red-600 tracking-tighter">{settings.currency} {totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled={isPlacingOrder || items.length === 0}
                  onClick={handlePlaceOrder}
                  className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-red-200 disabled:bg-gray-200 disabled:shadow-none transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      PLACING ORDER...
                    </>
                  ) : (
                    <>
                      CONFIRM ORDER
                      <ChevronRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {placedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="fixed inset-4 m-auto h-fit max-w-md bg-white z-[70] rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-red-600 p-12 text-center relative overflow-hidden">
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
                >
                  <CheckCircle2 className="w-12 h-12 text-red-600" />
                </motion.div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-2 relative z-10">Yum! Order Placed</h2>
                <p className="text-white/80 font-black uppercase tracking-[0.2em] text-sm relative z-10">Order ID: #{placedOrder.orderNumber}</p>
                
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/5 rounded-full -ml-20 -mb-20 blur-2xl" />
              </div>

              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Coffee className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                    <p className="text-xl font-black text-gray-900 tracking-tight">25 - 35 Minutes</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Order Summary</span>
                    <span className="text-sm font-black text-gray-900">{placedOrder.items.length} Items</span>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2 no-scrollbar">
                    {placedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <p className="text-sm font-bold text-gray-800">
                          <span className="text-red-600 font-black mr-2">{item.quantity}x</span>
                          {item.product?.name || "Item"}
                        </p>
                        <p className="text-sm font-black text-gray-900">{settings.currency} {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-dashed space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-lg font-black text-gray-900 uppercase tracking-tighter">Amount Paid</span>
                    <span className="text-3xl font-black text-red-600 tracking-tighter">{settings.currency} {placedOrder.total.toLocaleString()}</span>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/order/track/${placedOrder.id}`)}
                    className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-gray-200 flex items-center justify-center gap-4 active:scale-95 transition-all"
                  >
                    LIVE TRACKING
                    <Navigation className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={() => setPlacedOrder(null)}
                    className="w-full text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-900 transition-colors"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DeliveryPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Preparing Menu...</p>
      </div>
    </div>}>
      <DeliveryContent />
    </Suspense>
  );
}
