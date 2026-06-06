import Link from "next/link";
import { Coffee, ArrowRight, ShieldCheck, Zap, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-32">
        <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
          <div className="bg-red-50 p-3 md:p-4 rounded-3xl animate-bounce">
            <Coffee className="w-10 h-10 md:w-12 md:h-12 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
            The Future of <br />
            <span className="text-red-600">Café Ordering</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl font-medium px-4">
            A modern, full-stack self-ordering system designed for speed, 
            efficiency, and a premium customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto px-6">
            <Link 
              href="/order?table=1" 
              className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Try Customer Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/admin/orders" 
              className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl shadow-gray-200 hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-20 md:mt-32">
          <div className="p-6 md:p-8 bg-gray-50 rounded-[2.5rem] space-y-4">
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Real-time Updates</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">
              Powered by Firebase, customers track their order status live without refreshing.
            </p>
          </div>
          <div className="p-6 md:p-8 bg-gray-50 rounded-[2.5rem] space-y-4">
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
              <Smartphone className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">QR Code Based</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">
              Scan, order, and pay. No apps to download, just a seamless web experience.
            </p>
          </div>
          <div className="p-6 md:p-8 bg-gray-50 rounded-[2.5rem] space-y-4">
            <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Admin Control</h3>
            <p className="text-gray-500 font-medium leading-relaxed text-sm md:text-base">
              Powerful dashboard for staff to manage orders, menu items, and analytics.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 text-center text-gray-400 font-medium">
        <p>© 2026 CafePro System. Built with Next.js 15 & Prisma.</p>
      </footer>
    </div>
  );
}
