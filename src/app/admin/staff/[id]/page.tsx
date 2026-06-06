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
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/admin/staff" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Edit Staff Profile</h1>
          <p className="text-sm md:text-base text-gray-500 font-medium">Update team member details and access level</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gray-900 h-32 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-[2rem] shadow-lg">
            {formData.image ? (
              <img 
                src={formData.image} 
                alt="Profile" 
                className="w-24 h-24 rounded-[1.8rem] object-cover border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-50 rounded-[1.8rem] flex items-center justify-center text-3xl font-black text-gray-900 border-4 border-white">
                {formData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pt-20 p-8 space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Access Role</label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="STAFF">STAFF (Orders only)</option>
                  <option value="OWNER">OWNER (Full access)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Staff Details
          </button>
        </form>
      </div>
    </div>
  );
}
