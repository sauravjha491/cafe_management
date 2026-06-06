"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Coffee, Lock, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { setUser, setRole, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        router.push("/admin/orders");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      let user: any = null;
      let role: any = "STAFF";

      try {
        // 1. Try Firebase Login first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        
        // Fetch user role from our database
        const res = await fetch(`/api/admin/staff`);
        const staffList = await res.json();
        const staffMember = staffList.find((s: any) => s.email === email);
        role = staffMember?.role || "STAFF";
      } catch (firebaseError: any) {
        console.log("Firebase login failed, trying local fallback...");
        
        // 2. Fallback to local login if Firebase fails
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          user = {
            uid: data.user.id,
            email: data.user.email,
            displayName: data.user.name,
          };
          role = data.user.role;
        } else {
          // If both fail, throw the original firebase error or a custom one
          throw firebaseError;
        }
      }
      
      setUser(user);
      setRole(role);
      
      toast.success("Welcome back!");
      router.push("/admin/orders");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-12">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-red-50 p-4 rounded-3xl mb-4">
            <Coffee className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">CAFE<span className="text-red-600">PRO</span></h1>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-2">Admin Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium"
                placeholder="admin@cafepro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging in...
              </>
            ) : (
              "Access Dashboard"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 font-medium">
            Forgot password? <span className="text-red-600 font-bold cursor-pointer hover:underline">Reset here</span>
          </p>
        </div>
      </div>
    </div>
  );
}
