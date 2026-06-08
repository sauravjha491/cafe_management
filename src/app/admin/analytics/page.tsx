"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, 
  ArrowUpRight, ArrowDownRight, Star, Calendar, 
  ChevronDown, Filter, Truck, Calculator,
  Download, FileText, Table as TableIcon,
  BarChart3, PieChart, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

type TimeRange = "today" | "weekly" | "monthly" | "all";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    dineInRevenue: 0,
    deliveryRevenue: 0,
    posRevenue: 0,
    dineInOrders: 0,
    deliveryOrders: 0,
    posOrders: 0,
    topItems: [] as any[],
    revenueTrend: { labels: [] as string[], data: [] as number[] },
    orderTrend: { labels: [] as string[], data: [] as number[] },
    categorySales: {} as any,
  });

  const [settings, setSettings] = useState<any>({ 
    cafeName: "CafePro",
    currency: "Rs." 
  });

  useEffect(() => {
    fetchStats();
    fetch("/api/admin/settings").then(res => res.json()).then(data => {
      if (!data.error) setSettings(data);
    });
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

    // Revenue by type
    const dineInOrders = filteredOrders.filter((o: any) => o.type === "TABLE");
    const deliveryOrders = filteredOrders.filter((o: any) => o.type === "DELIVERY");
    const posOrders = filteredOrders.filter((o: any) => o.type === "POS");

    const dineInRevenue = dineInOrders.reduce((acc: number, o: any) => acc + o.total, 0);
    const deliveryRevenue = deliveryOrders.reduce((acc: number, o: any) => acc + o.total, 0);
    const posRevenue = posOrders.reduce((acc: number, o: any) => acc + o.total, 0);

    // Top Items
    const itemCounts: any = {};
    const categorySales: any = {};
    filteredOrders.forEach((o: any) => {
      o.items.forEach((i: any) => {
        itemCounts[i.product.name] = (itemCounts[i.product.name] || 0) + i.quantity;
        const catName = i.product.category?.name || "Other";
        categorySales[catName] = (categorySales[catName] || 0) + (i.price * i.quantity);
      });
    });

    const topItems = Object.entries(itemCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a: any, b: any) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    // Trend Data (Group by date)
    const trendMap: any = {};
    filteredOrders.forEach((o: any) => {
      const date = new Date(o.createdAt).toLocaleDateString();
      if (!trendMap[date]) trendMap[date] = { revenue: 0, orders: 0 };
      trendMap[date].revenue += o.total;
      trendMap[date].orders += 1;
    });

    const trendLabels = Object.keys(trendMap).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const revenueTrend = trendLabels.map(label => trendMap[label].revenue);
    const orderTrend = trendLabels.map(label => trendMap[label].orders);

    setStats({
      totalOrders: filteredOrders.length,
      totalRevenue: dineInRevenue + deliveryRevenue + posRevenue,
      dineInRevenue,
      deliveryRevenue,
      posRevenue,
      dineInOrders: dineInOrders.length,
      deliveryOrders: deliveryOrders.length,
      posOrders: posOrders.length,
      topItems,
      revenueTrend: { labels: trendLabels, data: revenueTrend },
      orderTrend: { labels: trendLabels, data: orderTrend },
      categorySales,
    });
    setIsLoading(false);
  };

  const exportPDF = () => {
    const doc = new (jsPDF as any)();
    doc.setFontSize(20);
    doc.text(`${settings.cafeName} - Sales Report`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Time Range: ${timeRange.toUpperCase()}`, 14, 30);
    doc.text(`Total Revenue: ${settings.currency} ${stats.totalRevenue.toLocaleString()}`, 14, 38);
    
    const tableData = [
      ["Type", "Orders", "Revenue"],
      ["Dine-In", stats.dineInOrders, `${settings.currency} ${stats.dineInRevenue.toLocaleString()}`],
      ["Delivery", stats.deliveryOrders, `${settings.currency} ${stats.deliveryRevenue.toLocaleString()}`],
      ["POS", stats.posOrders, `${settings.currency} ${stats.posRevenue.toLocaleString()}`],
      ["Total", stats.totalOrders, `${settings.currency} ${stats.totalRevenue.toLocaleString()}`],
    ];

    (doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 45,
    });

    doc.save(`sales-report-${timeRange}.pdf`);
  };

  const exportExcel = () => {
    const data = [
      ["Sales Report", settings.cafeName],
      ["Time Range", timeRange],
      [],
      ["Type", "Orders", "Revenue"],
      ["Dine-In", stats.dineInOrders, stats.dineInRevenue],
      ["Delivery", stats.deliveryOrders, stats.deliveryRevenue],
      ["POS", stats.posOrders, stats.posRevenue],
      ["Total", stats.totalOrders, stats.totalRevenue],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, `sales-report-${timeRange}.xlsx`);
  };

  const lineChartData = {
    labels: stats.revenueTrend.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: stats.revenueTrend.data || [],
        fill: true,
        borderColor: 'rgb(220, 38, 38)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const doughnutData = {
    labels: ['Dine-In', 'Delivery', 'POS'],
    datasets: [
      {
        data: [stats.dineInRevenue, stats.deliveryRevenue, stats.posRevenue],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-2">Analytics</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Insight into your business growth</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            {(["today", "weekly", "monthly", "all"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  timeRange === range 
                    ? "bg-red-600 text-white shadow-xl shadow-red-200" 
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={exportPDF}
              className="p-3 bg-white text-gray-400 border border-gray-100 rounded-2xl hover:text-red-600 hover:border-red-100 transition-all shadow-sm group"
              title="Export PDF"
            >
              <FileText className="w-6 h-6" />
            </button>
            <button 
              onClick={exportExcel}
              className="p-3 bg-white text-gray-400 border border-gray-100 rounded-2xl hover:text-green-600 hover:border-green-100 transition-all shadow-sm group"
              title="Export Excel"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `${settings.currency} ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Dine-In Sales", value: `${settings.currency} ${stats.dineInRevenue.toLocaleString()}`, icon: TableIcon, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Delivery Sales", value: `${settings.currency} ${stats.deliveryRevenue.toLocaleString()}`, icon: Truck, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-gray-200 transition-all group"
          >
            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg)}>
              <stat.icon className={cn("w-8 h-8", stat.color)} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Revenue Trend</h2>
            </div>
            <Activity className="w-5 h-5 text-gray-300" />
          </div>
          <div className="h-80">
            <Line 
              data={lineChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, grid: { color: '#f8fafc' } },
                  x: { grid: { display: false } }
                }
              }} 
            />
          </div>
        </div>

        {/* Revenue Distribution */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Sales Split</h2>
          </div>
          <div className="h-64 relative">
            <Doughnut 
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                cutout: '70%',
              }}
            />
          </div>
          <div className="mt-8 space-y-4">
            {[
              { label: "Dine-In", value: stats.dineInRevenue, color: "bg-blue-500" },
              { label: "Delivery", value: stats.deliveryRevenue, color: "bg-amber-500" },
              { label: "POS", value: stats.posRevenue, color: "bg-emerald-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", item.color)} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{((item.value / stats.totalRevenue) * 100 || 0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Items */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8 flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            Bestsellers
          </h2>
          <div className="space-y-6">
            {stats.topItems.map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-gray-100">0{i + 1}</span>
                    <span className="font-bold text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{item.count} Sold</span>
                </div>
                <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / stats.topItems[0].count) * 100}%` }}
                    className="h-full bg-red-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-8 flex items-center gap-3">
            <Calculator className="w-6 h-6 text-indigo-600" />
            Category Revenue
          </h2>
          <div className="space-y-4">
            {Object.entries(stats.categorySales).map(([name, revenue]: any, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:border-gray-100 border border-transparent transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-gray-300 border border-gray-100 group-hover:text-indigo-600 transition-colors">
                    {name[0]}
                  </div>
                  <span className="font-bold text-gray-700">{name}</span>
                </div>
                <span className="font-black text-gray-900">{settings.currency} {revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
