"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { Coffee, Lock, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { setUser, setRole, setLoading } = useAuthStore();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-100/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-12"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="bg-red-600 p-5 rounded-[2rem] mb-6 shadow-xl shadow-red-200">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            CAFE<span className="text-red-600">PRO</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Admin Infrastructure</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
              <input
                type="email"
                required
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-red-500/5 focus:bg-white focus:border-red-100 outline-none transition-all font-bold"
                placeholder="admin@cafepro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secret Key</label>
              <button type="button" className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Forgot?</button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
              <input
                type="password"
                required
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-red-500/5 focus:bg-white focus:border-red-100 outline-none transition-all font-bold"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4 disabled:bg-slate-200 disabled:shadow-none"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Authorizing...
              </>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
        </form>

        <div className="mt-12 text-center pt-8 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Protected by Enterprise Security
          </p>
        </div>
      </motion.div>
    </div>
  );
}
