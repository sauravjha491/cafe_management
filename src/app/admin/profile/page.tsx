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
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">Edit Profile</h1>
        <p className="text-sm md:text-base text-gray-500 font-medium">Manage your personal information and account settings</p>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-red-600 h-32 relative">
          <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-[2rem] shadow-lg">
            {formData.image ? (
              <img 
                src={formData.image} 
                alt="Profile" 
                className="w-24 h-24 rounded-[1.8rem] object-cover border-4 border-white"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-50 rounded-[1.8rem] flex items-center justify-center text-3xl font-black text-red-600 border-4 border-white">
                {formData.name.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <button className="absolute bottom-0 right-0 p-2 bg-gray-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="pt-20 p-8 space-y-8">
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
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Profile Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none font-bold"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 opacity-60">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address (Read Only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  disabled
                  type="email"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold cursor-not-allowed"
                  value={user.email || ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Access Role</label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className={cn(
                  "p-2 rounded-xl",
                  role === "OWNER" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                )}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-gray-900 leading-none">{role}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Permissions level</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:bg-gray-300"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2 active:scale-95 border border-gray-100"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
