"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Printer, Trash2, Edit2, Search, ExternalLink, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    const res = await fetch("/api/admin/tables");
    const data = await res.json();
    setTables(data);
    setLoading(false);
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: newTableNumber }),
      });
      if (res.ok) {
        toast.success("Table added successfully");
        setNewTableNumber("");
        setIsModalOpen(false);
        fetchTables();
      } else {
        toast.error("Table already exists");
      }
    } catch (error) {
      toast.error("Failed to add table");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    
    // Optimistic delete
    const previousTables = [...tables];
    setTables(tables.filter(t => t.id !== id));

    try {
      const res = await fetch(`/api/admin/tables?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Table deleted");
    } catch (error) {
      setTables(previousTables);
      toast.error("Failed to delete table");
    }
  };

  const filteredTables = tables.filter((t) => 
    t.tableNumber.toString().includes(searchQuery)
  );

  const printQR = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-${tableNumber}`) as HTMLCanvasElement;
    if (canvas) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Print QR - Table ${tableNumber}</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                .card { padding: 40px; border: 4px solid #000; border-radius: 40px; text-align: center; }
                h1 { font-size: 64px; margin-bottom: 30px; font-weight: 900; }
                p { margin-top: 30px; font-size: 32px; color: #666; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>TABLE ${tableNumber}</h1>
                ${canvas.outerHTML}
                <p>Scan to Order</p>
              </div>
              <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
            </body>
          </html>
        `);
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Table Management</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">Manage tables and generate QR codes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Table
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 md:p-4 rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search table number..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />
          ))
        ) : (
          filteredTables.map((table) => (
            <div key={table.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
              <div className="p-6 flex-1 flex flex-col items-center justify-center gap-4">
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200 transition-all group-hover:border-red-200 group-hover:bg-red-50">
                  <QRCodeSVG
                    id={`qr-${table.tableNumber}`}
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/order?table=${table.tableNumber}`}
                    size={140}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Table {table.tableNumber}</h3>
                  <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Ready for scan</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t flex gap-2">
                <button 
                  onClick={() => printQR(table.tableNumber)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button 
                  onClick={() => window.open(`/order?table=${table.tableNumber}`, "_blank")}
                  className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-2.5 bg-white border border-gray-200 text-red-600 rounded-xl hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Table Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white z-[70] rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900">New Table</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Table Number</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-black text-center text-2xl"
                    placeholder="1"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Table"}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
