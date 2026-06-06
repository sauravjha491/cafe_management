"use client";

import { useEffect, useState } from "react";
import {
  DollarSign, ShoppingBag, Users, Clock,
  ArrowUpRight, Coffee, Star, ChevronRight,
  TrendingUp, AlertCircle, ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminDashboard() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuthStore();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    activeTables: 0,
    recentOrders: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [configWarning, setConfigWarning] = useState(false);

  useEffect(() => {
    if (!authLoading && role === "STAFF") {
      router.push("/admin/orders");
    }
  }, [role, authLoading, router]);

  useEffect(() => {
    if (role === "STAFF") return;
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/orders");
        const allOrders = await res.json();
        
        const now = new Date();
        const todayOrders = allOrders.filter((o: any) => 
          new Date(o.createdAt).toDateString() === now.toDateString()
        );

        const todayRevenue = todayOrders.reduce((acc: number, o: any) => acc + o.total, 0);
        const pendingOrders = allOrders.filter((o: any) => o.status === "PENDING").length;
        const activeTables = new Set(allOrders.filter((o: any) => o.status !== "SERVED").map((o: any) => o.tableNumber)).size;

        setStats({
          todayRevenue,
          todayOrders: todayOrders.length,
          pendingOrders,
          activeTables,
          recentOrders: allOrders.slice(0, 5),
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    // Check config status via staff API
    fetch("/api/admin/staff")
      .then(res => res.json())
      .then(data => {
        // If the API returns any warnings about configuration
        if (Array.isArray(data) && data.length > 0 && data[0]._warning) {
          setConfigWarning(true);
        }
      });

    fetchDashboardData();
  }, []);

  const cards = [
    { label: "Today's Revenue", value: `Rs. ${stats.todayRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Today's Orders", value: stats.todayOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Active Tables", value: stats.activeTables, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  if (role === "STAFF") return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Config Warning Banner */}
      {configWarning && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4 text-orange-800"
        >
          <div className="bg-orange-100 p-2 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm uppercase tracking-tight">System Configuration Incomplete</p>
            <p className="text-xs font-medium opacity-80">Firebase Admin is not fully configured. Staff login features are currently limited to local database only.</p>
          </div>
          <Link href="/admin/settings" className="text-xs font-black uppercase tracking-widest hover:underline shrink-0">Configure</Link>
        </motion.div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <Link 
          href="/admin/orders"
          className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          View Live Orders
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={card.label}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300", card.bg)}>
                  <Icon className={cn("w-6 h-6", card.color)} />
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{card.value}</h3>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-black text-red-600 uppercase tracking-widest hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {stats.recentOrders.length === 0 ? (
              <div className="py-10 text-center text-gray-400 font-bold">No orders yet today</div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 hover:bg-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-gray-400 border border-gray-100">
                      #{order.orderNumber.toString().slice(-2)}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 tracking-tight">{order.customerName}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Table {order.tableNumber} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-black text-gray-900">Rs. {order.total.toLocaleString()}</p>
                      <span className={cn(
                        "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                        order.status === "SERVED" ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-600"
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[3rem] text-white shadow-xl shadow-gray-200">
            <h2 className="text-xl font-black mb-6 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/admin/menu" className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                <Coffee className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Update Menu</span>
              </Link>
              <Link href="/admin/staff" className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                <Star className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Manage Staff</span>
              </Link>
              <Link href="/admin/settings" className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group">
                <AlertCircle className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Cafe Settings</span>
              </Link>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Growth Tip</h2>
            </div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Your "Espresso" is the top selling item this week. Consider adding it to the featured list!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
