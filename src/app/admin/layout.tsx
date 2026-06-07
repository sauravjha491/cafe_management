"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Coffee, Users, Table as TableIcon, 
  BarChart3, Settings, LogOut, Menu, X, Loader2, 
  ShoppingBag, Clock, Bell, Volume2, VolumeX 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Menu", href: "/admin/menu", icon: Coffee },
  { label: "Tables", href: "/admin/tables", icon: TableIcon },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Staff", href: "/admin/staff", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const { user, setUser, loading, setLoading, role } = useAuthStore();
  const [notificationAudio, setNotificationAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize sound state from localStorage
  useEffect(() => {
    const savedSound = localStorage.getItem("adminSoundEnabled");
    if (savedSound === "true") {
      setIsSoundEnabled(true);
    }
  }, []);

  useEffect(() => {
    setNotificationAudio(new Audio("/notification.mp3"));
  }, []);

  const toggleSound = () => {
    if (notificationAudio) {
      notificationAudio.play()
        .then(() => {
          const newState = !isSoundEnabled;
          setIsSoundEnabled(newState);
          localStorage.setItem("adminSoundEnabled", newState.toString());
          toast.success(newState ? "Notifications sound enabled" : "Notifications sound disabled");
        })
        .catch(() => toast.error("Please allow sound in your browser settings"));
    }
  };

  const playNotificationSound = () => {
    // We always try to play if enabled
    if (isSoundEnabled) {
      console.log("Attempting to play notification sound...");
      const audio = new Audio("/notification.mp3");
      audio.play().catch(e => {
        console.error("Audio playback failed:", e);
      });
    } else {
      console.log("Sound is disabled, skipping playback.");
    }
  };

  const showTestNotification = () => {
    playNotificationSound();
    const mockOrder = {
      orderNumber: 9999,
      customerName: "Test Customer",
      tableNumber: 7,
      total: 1500,
      createdAt: new Date().toISOString(),
      items: [
        { name: "Test Item 1", quantity: 2, note: "Extra spicy" },
        { name: "Test Item 2", quantity: 1 }
      ]
    };

    toast.custom((t) => (
      <div
        className={cn(
          "bg-white rounded-3xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] border-2 border-red-500 overflow-hidden w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-500",
          t.visible ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-10"
        )}
      >
        <div className="bg-red-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md animate-pulse">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-wider">Test Notification</h3>
              <p className="text-white/80 text-[10px] font-bold">#9999 • Just now</p>
            </div>
          </div>
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer & Table</p>
              <p className="font-black text-gray-900 text-lg">{mockOrder.customerName}</p>
              <p className="text-red-600 font-bold text-sm">Table No: {mockOrder.tableNumber}</p>
            </div>
            <div className="bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-pulse">
              <span className="text-[10px] font-black text-red-600 uppercase">Test Mode</span>
            </div>
          </div>

          <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items to Prepare</p>
            {mockOrder.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex gap-2 items-center">
                  <span className="font-black text-red-600 bg-red-100 w-5 h-5 flex items-center justify-center rounded-md">{item.quantity}</span>
                  <span className="font-bold text-gray-800">{item.name}</span>
                </div>
                {item.note && <span className="text-[8px] text-orange-500 italic font-bold">"{item.note}"</span>}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-lg font-black text-gray-900">Total: Rs. {mockOrder.total?.toLocaleString()}</span>
            <button 
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              Close Test
            </button>
          </div>
        </div>
      </div>
    ), { duration: 5000, position: "top-right" });
  };

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (role === "OWNER") return true;
    // Staff can only see Orders, Menu, and Tables
    return ["Orders", "Menu", "Tables"].includes(item.label);
  });

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role if not set
        if (!useAuthStore.getState().role) {
          try {
            const res = await fetch(`/api/admin/staff`);
            const staffList = await res.json();
            const staffMember = staffList.find((s: any) => s.email === firebaseUser.email);
            useAuthStore.getState().setRole(staffMember?.role || "STAFF");
          } catch (e) {
            console.error("Failed to fetch role", e);
          }
        }
        setUser(firebaseUser);
      }
      
      setLoading(false);

      // Only redirect if there is no user in store AND no firebase user
      const currentUser = useAuthStore.getState().user;
      if (!firebaseUser && !currentUser && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    });
    return () => unsubscribe();
  }, [setUser, setLoading, router, pathname]);

  // Auto-hide sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.push("/admin/login");
  };

  // Real-time Order Listener for Notifications
  useEffect(() => {
    if (!db || !user) return;

    console.log("Starting real-time order listener...");
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    let isInitialLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      console.log(`Order snapshot received: ${snapshot.size} docs, initial: ${isInitialLoad}`);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          if (isInitialLoad) {
            console.log("Skipping initial order:", change.doc.id);
            return;
          }
          
          const order = change.doc.data();
          console.log("New order detected:", order);
          
          // Play "Fire Alarm" style sound
          playNotificationSound();

          // Detailed Stacking Notification
          toast.custom((t) => {
            // Robust date handling
            let dateStr = "Just now";
            try {
              const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
              if (!isNaN(date.getTime())) {
                dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            } catch (e) {
              console.error("Date parsing error:", e);
            }

            return (
              <div
                className={cn(
                  "bg-white rounded-3xl shadow-[0_20px_50px_rgba(220,38,38,0.3)] border-2 border-red-500 overflow-hidden w-[380px] max-w-[calc(100vw-2rem)] transition-all duration-500",
                  t.visible ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-10"
                )}
              >
                <div className="bg-red-600 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md animate-pulse">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-sm uppercase tracking-wider">New Order Received!</h3>
                      <p className="text-white/80 text-[10px] font-bold">#{order.orderNumber} • {dateStr}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer & Table</p>
                      <p className="font-black text-gray-900 text-lg">{order.customerName}</p>
                      <p className="text-red-600 font-bold text-sm">Table No: {order.tableNumber}</p>
                    </div>
                    <div className="bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-pulse">
                      <span className="text-[10px] font-black text-red-600 uppercase">Action Required</span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items to Prepare</p>
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex gap-2 items-center">
                          <span className="font-black text-red-600 bg-red-100 w-5 h-5 flex items-center justify-center rounded-md">{item.quantity}</span>
                          <span className="font-bold text-gray-800">{item.name}</span>
                        </div>
                        {item.note && <span className="text-[8px] text-orange-500 italic font-bold">"{item.note}"</span>}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-black text-gray-900">Total: Rs. {order.total?.toLocaleString()}</span>
                    <button 
                      onClick={() => {
                        router.push("/admin/orders");
                        toast.dismiss(t.id);
                      }}
                      className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                      View in Dashboard
                    </button>
                  </div>
                </div>
              </div>
            );
          }, { 
            duration: 15000,
            position: "top-right",
            id: `new-order-${change.doc.id}` 
          });
        }
      });
      isInitialLoad = false;
    }, (error) => {
      console.error("Firestore Orders error:", error);
      toast.error("Real-time orders connection lost. Please refresh.");
    });

    return () => unsub();
  }, [user, router]);

  // Waiter Call Listener
  useEffect(() => {
    if (!db || !user) return;

    console.log("Starting waiter call listener...");
    const q = query(collection(db, "waiter_calls"), orderBy("createdAt", "desc"));
    let isInitialLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      console.log(`Waiter call snapshot received: ${snapshot.size} docs, initial: ${isInitialLoad}`);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          if (isInitialLoad) {
            console.log("Skipping initial waiter call:", change.doc.id);
            return;
          }

          const call = change.doc.data();
          console.log("New waiter call detected:", call);
          
          // Play "Fire Alarm" style sound
          playNotificationSound();

          toast.custom((t) => (
            <div className={cn(
              "bg-white rounded-3xl shadow-[0_20px_50px_rgba(249,115,22,0.3)] border-2 border-orange-500 overflow-hidden w-[340px] max-w-[calc(100vw-2rem)] transition-all duration-500",
              t.visible ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-95 translate-x-10"
            )}>
              <div className="bg-orange-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <Bell className="w-5 h-5 text-white animate-ring" />
                  </div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Waiter Requested!</h3>
                </div>
                <button onClick={() => toast.dismiss(t.id)}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-gray-900 font-black text-2xl mb-1">Table {call.tableNumber}</p>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  {call.customerName} needs assistance at their table.
                </p>
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="mt-4 w-full bg-gray-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
                >
                  Acknowledge Request
                </button>
              </div>
            </div>
          ), { duration: 12000, position: "top-right", id: `waiter-call-${change.doc.id}` });
        }
      });
      isInitialLoad = false;
    }, (error) => {
      console.error("Firestore Waiter Calls error:", error);
      toast.error("Real-time waiter connection lost. Please refresh.");
    });

    return () => unsub();
  }, [user]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Verifying Admin Session</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-2xl shadow-gray-200/50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <Link href="/admin/orders" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-red-200">C</div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">CAFE<span className="text-red-600">PRO</span></span>
            </Link>
            <button className="lg:hidden p-2 text-gray-400 hover:text-gray-900" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all group",
                    isActive 
                      ? "bg-red-600 text-white shadow-xl shadow-red-100" 
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-50 space-y-3 bg-white">
            <Link
              href="/admin/profile"
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                pathname === "/admin/profile" 
                  ? "bg-red-50 text-red-600" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Users className="w-5 h-5" />
              My Profile
            </Link>
            {role === "OWNER" && (
              <Link
                href="/admin/settings"
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all",
                  pathname === "/admin/settings" 
                    ? "bg-red-50 text-red-600" 
                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}
            
            <div className="h-px bg-gray-50 my-2" />

            {/* Sound Toggle */}
            <div className="flex gap-2">
              <button 
                onClick={toggleSound}
                className={cn(
                  "flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all",
                  isSoundEnabled ? "text-green-600 bg-green-50" : "text-gray-400 bg-gray-50"
                )}
              >
                {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span className="text-xs">{isSoundEnabled ? "Sound On" : "Sound Off"}</span>
              </button>
              <button 
                onClick={showTestNotification}
                className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all"
                title="Test Notification & Sound"
              >
                <Bell className="w-5 h-5" />
              </button>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all group"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-gray-50 rounded-xl text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-black text-gray-900 tracking-tight">CAFE<span className="text-red-600">PRO</span></span>
          <div className="w-10 h-10" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 p-4 lg:p-8 no-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
