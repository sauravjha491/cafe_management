"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Coffee, Users, Table as TableIcon, 
  BarChart3, Settings, LogOut, Menu, X, Loader2, 
  ShoppingBag, Clock 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

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
  const { user, setUser, loading, setLoading, role } = useAuthStore();

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (role === "OWNER") return true;
    // Staff can only see Overview, Orders, Menu, and Tables
    return ["Overview", "Orders", "Menu", "Tables"].includes(item.label);
  });

  useEffect(() => {
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
      }
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser && pathname !== "/admin/login") {
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
