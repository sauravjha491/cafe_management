"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  ArrowUpRight, ArrowDownRight, Star, Calendar, 
  ChevronDown, Filter 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type TimeRange = "today" | "weekly" | "monthly" | "all";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeTables: 0,
    pendingOrders: 0,
    topItems: [] as any[],
    recentSales: [] as any[],
  });

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    const res = await fetch("/api/orders");
    const allOrders = await res.json();
    
    // Filter orders based on timeRange
    const now = new Date();
    const filteredOrders = allOrders.filter((o: any) => {
      const orderDate = new Date(o.createdAt);
      if (timeRange === "today") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeRange === "weekly") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      if (timeRange === "monthly") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return orderDate >= monthAgo;
      }
      return true;
    });

    const totalRevenue = filteredOrders.reduce((acc: number, o: any) => acc + o.total, 0);
    const pendingOrders = filteredOrders.filter((o: any) => o.status === "PENDING").length;
    
    // Calculate top items
    const itemCounts: any = {};
    filteredOrders.forEach((o: any) => {
      o.items.forEach((i: any) => {
        itemCounts[i.product.name] = (itemCounts[i.product.name] || 0) + i.quantity;
      });
    });
    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    setStats({
      totalOrders: filteredOrders.length,
      totalRevenue,
      activeTables: new Set(filteredOrders.map((o: any) => o.tableNumber)).size,
      pendingOrders,
      topItems,
      recentSales: filteredOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    });
    setIsLoading(false);
  };

  const cards = [
    { label: "Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50", trend: "+12.5%" },
    { label: "Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", trend: "+8.2%" },
    { label: "Tables", value: stats.activeTables, icon: Users, color: "text-purple-600", bg: "bg-purple-50", trend: "-2.4%" },
    { label: "Pending", value: stats.pendingOrders, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", trend: "+4.1%" },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Analytics Overview</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">Track your cafe's performance metrics</p>
        </div>
        
        {/* Time Range Filter */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
          {(["today", "weekly", "monthly", "all"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                timeRange === range 
                  ? "bg-red-600 text-white shadow-lg shadow-red-200" 
                  : "text-gray-400 hover:text-gray-900"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 h-32 md:h-40 animate-pulse" />
            ))
          ) : (
            cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={card.label} 
                  className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                >
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <div className={cn("p-2.5 md:p-4 rounded-xl md:rounded-3xl transition-transform group-hover:scale-110 duration-300", card.bg)}>
                      <Icon className={cn("w-5 h-5 md:w-6 md:h-6", card.color)} />
                    </div>
                    <div className={cn(
                      "flex items-center text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-1 rounded-lg uppercase tracking-tighter",
                      card.trend.startsWith("+") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {card.trend.startsWith("+") ? <ArrowUpRight className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" /> : <ArrowDownRight className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />}
                      {card.trend}
                    </div>
                  </div>
                  <p className="text-[9px] md:text-xs font-black text-gray-400 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-1">{card.label}</p>
                  <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter">{card.value}</h3>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Top Selling Items */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 p-2.5 md:p-3 rounded-xl md:rounded-2xl">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Top Performance</h2>
            </div>
            <Filter className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-6 md:space-y-8">
            {stats.topItems.length === 0 ? (
              <div className="py-10 text-center text-gray-400 font-bold">No data available for this period</div>
            ) : (
              stats.topItems.map((item, index) => (
                <div key={item.name} className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl font-black text-gray-200">0{index + 1}</span>
                      <span className="font-bold text-gray-700 text-sm md:text-base">{item.name}</span>
                    </div>
                    <span className="font-black text-gray-900 text-sm md:text-base">{item.count} <span className="text-gray-400 text-[10px] md:text-xs uppercase ml-1 font-black">Orders</span></span>
                  </div>
                  <div className="h-2.5 md:h-3 w-full bg-gray-50 rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / stats.topItems[0].count) * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-red-600 rounded-full shadow-sm"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Recent Activity</h2>
            <ChevronDown className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-3 md:space-y-4">
            {stats.recentSales.length === 0 ? (
              <div className="py-10 text-center text-gray-400 font-bold">No recent sales</div>
            ) : (
              stats.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-[1.25rem] md:rounded-[1.5rem] border border-transparent hover:border-gray-100 hover:bg-white transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-gray-300 border border-gray-100 text-base md:text-lg group-hover:text-red-200 transition-colors">
                      #{sale.orderNumber.toString().slice(-2)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 tracking-tight truncate">{sale.customerName}</p>
                      <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-red-600 text-base md:text-lg tracking-tighter">${sale.total.toFixed(2)}</p>
                    <span className="text-[8px] md:text-[9px] font-black text-green-600 bg-green-50 px-1.5 md:px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-6 md:mt-8 py-3.5 md:py-4 text-[10px] md:text-sm font-black text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-dashed border-red-100 uppercase tracking-widest active:scale-95">
            Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
}
