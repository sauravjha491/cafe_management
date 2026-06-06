import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  user: FirebaseUser | null;
  role: "OWNER" | "STAFF" | null;
  setUser: (user: FirebaseUser | null) => void;
  setRole: (role: "OWNER" | "STAFF" | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
}));
