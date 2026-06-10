"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  User, Mail, Shield, Save, 
  Loader2, ArrowLeft, Phone, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

export default function EditStaffPage() {
  const { id } = useParams();
  const router = useRouter();
  const { role: currentUserRole } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "STAFF",
    phone: "",
    image: "",
  });

  useEffect(() => {
    if (currentUserRole !== "OWNER") {
      router.push("/admin/staff");
      return;
    }

    fetch(`/api/admin/staff`)
      .then(res => res.json())
      .then(staffList => {
        const member = staffList.find((s: any) => s.id === id);
        if (member) {
          setFormData({
            name: member.name || "",
            email: member.email || "",
            role: member.role || "STAFF",
            phone: member.phone || "",
            image: member.image || "",
          });
        } else {
          toast.error("Staff member not found");
          router.push("/admin/staff");
        }
        setLoading(false);
      });
  }, [id, currentUserRole, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Staff profile updated!");
        router.push("/admin/staff");
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Failed to update staff member");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-w-0 bg-slate-50/50">
      <div className="p-4 lg:p-8 shrink-0 bg-white border-b border-slate-100 lg:bg-transparent lg:border-0">
        <div className="flex items-center gap-6">
          <Link href="/admin/staff" className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Edit Staff Profile</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Update team member details and access level</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:px-8 pb-20">
        <div className="max-w-3xl bg-white rounded-2xl lg:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-slate-900 h-40 relative">
            <div className="absolute -bottom-16 left-10 p-1.5 bg-white rounded-[2.5rem] shadow-xl">
              {formData.image ? (
                <img 
                  src={formData.image} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl font-black text-slate-900 border-4 border-white">
                  {formData.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button className="absolute bottom-2 right-2 p-3 bg-red-600 text-white rounded-2xl shadow-lg hover:bg-red-700 transition-all active:scale-90">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="pt-24 p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <input
                    required
                    type="text"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:bg-white outline-none font-bold transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <input
                    required
                    type="email"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:bg-white outline-none font-bold transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <input
                    type="text"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:bg-white outline-none font-bold transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                <div className="relative group">
                  <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <select
                    className="w-full pl-14 pr-10 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:bg-white outline-none font-bold transition-all appearance-none cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="STAFF">STAFF (Orders only)</option>
                    <option value="OWNER">OWNER (Full access)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200"
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  );
}
