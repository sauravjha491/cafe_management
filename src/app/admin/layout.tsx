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

  const toggleSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.play()
      .then(() => setIsSoundEnabled(true))
      .catch(() => toast.error("Sound file missing or blocked by browser"));
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

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    let isInitialLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitialLoad) {
          const order = change.doc.data();
          
          // Play "Fire Alarm" style sound
          const audio = new Audio("/notification.mp3");
          audio.loop = false;
          audio.play().catch(e => console.error("Audio error:", e));

          // Detailed Stacking Notification
          toast.custom((t) => (
            <div
              className={cn(
                "bg-white rounded-3xl shadow-2xl border-2 border-red-500 overflow-hidden w-[380px] animate-in slide-in-from-right-10 duration-500",
                t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
            >
              <div className="bg-red-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-wider">New Order!</h3>
                    <p className="text-white/80 text-[10px] font-bold">#{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString()}</p>
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
                  <div className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <span className="text-[10px] font-black text-gray-500 uppercase">Pending</span>
                  </div>
                </div>

                <div className="space-y-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order Details</p>
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div className="flex gap-2 items-center">
                        <span className="font-black text-red-600 bg-red-50 w-5 h-5 flex items-center justify-center rounded-md">{item.quantity}</span>
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
                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
                  >
                    View Order
                  </button>
                </div>
              </div>
            </div>
          ), { 
            duration: 10000,
            position: "top-right",
            id: `new-order-${change.doc.id}` 
          });
        }
      });
      isInitialLoad = false;
    });

    return () => unsub();
  }, [user, router]);

  // Waiter Call Listener
  useEffect(() => {
    if (!db || !user) return;

    const q = query(collection(db, "waiter_calls"), orderBy("createdAt", "desc"), limit(1));
    let isInitialLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitialLoad) {
          const call = change.doc.data();
          
          // Play "Fire Alarm" style sound
          const audio = new Audio("/notification.mp3");
          audio.play().catch(e => console.error("Audio error:", e));

          toast.custom((t) => (
            <div className={cn(
              "bg-white rounded-3xl shadow-2xl border-2 border-orange-500 overflow-hidden w-[340px] animate-in slide-in-from-right-10 duration-500",
              t.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            )}>
              <div className="bg-orange-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                    <Bell className="w-5 h-5 text-white animate-ring" />
                  </div>
                  <h3 className="text-white font-black text-sm uppercase tracking-wider">Waiter Called!</h3>
                </div>
                <button onClick={() => toast.dismiss(t.id)}>
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-gray-900 font-black text-xl mb-1">Table {call.tableNumber}</p>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{call.customerName} is requesting assistance</p>
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="mt-4 w-full bg-gray-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-black transition-all"
                >
                  I'm On It!
                </button>
              </div>
            </div>
          ), { duration: 8000, position: "top-right" });
        }
      });
      isInitialLoad = false;
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
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b flex items-center justify-between">
            <Link href="/admin/orders" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black">C</div>
              <span className="text-xl font-black text-gray-900 tracking-tight">CAFE<span className="text-red-600">PRO</span></span>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                    isActive 
                      ? "bg-red-50 text-red-600" 
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-red-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-1">
            <Link
              href="/admin/profile"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                pathname === "/admin/profile" 
                  ? "bg-red-50 text-red-600" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Users className="w-5 h-5" />
              My Profile
            </Link>
            {role === "OWNER" && (
              <Link
                href="/admin/settings"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                  pathname === "/admin/settings" 
                    ? "bg-red-50 text-red-600" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
              Sign Out
            </button>

            {/* Sound Toggle */}
            <button 
              onClick={toggleSound}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                isSoundEnabled ? "text-green-600 bg-green-50" : "text-gray-500 bg-gray-50"
              )}
            >
              {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              {isSoundEnabled ? "Sound Active" : "Enable Sound"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-black text-gray-900">CAFEPRO ADMIN</span>
          <div className="w-6 h-6" /> {/* Spacer */}
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
