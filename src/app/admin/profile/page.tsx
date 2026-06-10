"use client";

import { useEffect, useState } from "react";
import { 
  User, Mail, Shield, Save, 
  Loader2, Camera, LogOut, Phone,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import { auth } from "@/lib/firebase";
import { updateProfile, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, setUser, role } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    image: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Fetch additional details from DB
      fetch(`/api/admin/staff`)
        .then(res => res.json())
        .then(staffList => {
          const me = staffList.find((s: any) => s.email === user.email);
          setFormData({
            name: user.displayName || me?.name || "",
            phone: me?.phone || "",
            image: me?.image || "",
          });
          setLoading(false);
        });
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(user, { 
        displayName: formData.name,
        photoURL: formData.image 
      });
      
      // 2. Update local state
      setUser({ ...user, displayName: formData.name, photoURL: formData.image });

      // 3. Update database
      await fetch(`/api/admin/staff?email=${user.email}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name,
          phone: formData.phone,
          image: formData.image
        }),
      });

      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null);
    router.push("/admin/login");
  };

  if (!user || loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col min-w-0 bg-slate-50/50">
      <div className="p-4 lg:p-8 shrink-0 bg-white border-b border-slate-100 lg:bg-transparent lg:border-0">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">My Profile</h1>
        <p className="text-sm md:text-base text-slate-500 font-medium">Manage your personal information and account settings</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:px-8 pb-20">
        <div className="max-w-3xl bg-white rounded-2xl lg:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-red-600 h-40 relative">
            <div className="absolute -bottom-16 left-10 p-1.5 bg-white rounded-[2.5rem] shadow-xl">
              {formData.image ? (
                <img 
                  src={formData.image} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-[2rem] object-cover border-4 border-white"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl font-black text-red-600 border-4 border-white">
                  {formData.name.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <button className="absolute bottom-2 right-2 p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="pt-24 p-10 space-y-10">
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

              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profile Image URL</label>
                <div className="relative group">
                  <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="https://example.com/photo.jpg"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-red-500/5 focus:bg-white outline-none font-bold transition-all"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3 opacity-60">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Read Only)</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    disabled
                    type="email"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold cursor-not-allowed"
                    value={user.email || ""}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm transition-transform",
                    role === "OWNER" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                  )}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 leading-none">{role}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1.5 tracking-[0.1em]">Security Level</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-50">
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] bg-red-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-200"
              >
                {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Update Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-200"
              >
                <LogOut className="w-6 h-6" />
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
