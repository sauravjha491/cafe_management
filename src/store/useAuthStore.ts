import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  user: any; // Can be FirebaseUser or LocalUser
  role: "OWNER" | "STAFF" | null;
  setUser: (user: any) => void;
  setRole: (role: "OWNER" | "STAFF" | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      loading: true,
      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: "auth-storage",
    }
  )
);
