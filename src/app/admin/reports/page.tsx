"use client";

import { useEffect, useState } from "react";
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
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  ShoppingBag, Users, Calendar, 
  Download, Loader2, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

export default function SalesReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today"); // today, week, month

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/admin/reports?period=${period}`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-400">
      <Loader2 className="w-12 h-12 animate-spin" />
      <p className="font-black text-xs uppercase tracking-widest">Generating Reports...</p>
    </div>
  );

  const stats = [
    { label: "Total Revenue", value: data.revenue, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Orders", value: data.orderCount, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Average Order", value: data.avgOrder, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "New Customers", value: data.newCustomers, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const lineData = {
    labels: data.revenueTrend.map((t: any) => t.label),
    datasets: [
      {
        fill: true,
        label: 'Revenue',
        data: data.revenueTrend.map((t: any) => t.value),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 4,
        pointBackgroundColor: '#ef4444',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      },
      y: { 
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10, weight: 'bold' as const }, color: '#94a3b8' }
      },
    },
  };

  return (
    <div className="space-y-8 p-4 lg:p-8 overflow-y-auto h-full no-scrollbar">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Sales Analytics</h1>
          <p className="text-gray-500 font-bold text-sm">Real-time performance overview</p>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {["today", "week", "month"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                period === p ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
              <s.icon className={cn("w-6 h-6", s.color)} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {s.label.includes("Revenue") || s.label.includes("Average") ? `Rs. ${s.value.toLocaleString()}` : s.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Revenue Trend */}
        <div className="bg-white p-6 lg:p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-gray-900">Revenue Trend</h4>
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-black">+12.5%</span>
            </div>
          </div>
          <div className="h-[300px]">
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white p-6 lg:p-8 rounded-[3rem] border border-gray-100 shadow-sm">
          <h4 className="text-lg font-black text-gray-900 mb-8">Best Selling Items</h4>
          <div className="space-y-6">
            {data.bestSellers.length === 0 ? (
              <div className="py-20 text-center text-gray-300">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No data available</p>
              </div>
            ) : (
              data.bestSellers.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-xs text-gray-400 shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 text-sm truncate">{item.name}</p>
                    <div className="w-full bg-gray-50 h-2 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-red-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(item.sales / data.bestSellers[0].sales) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900 text-sm">{item.sales} sold</p>
                    <p className="text-[10px] font-bold text-green-600">Rs. {item.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {data.bestSellers.length > 0 && (
            <button className="w-full mt-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
