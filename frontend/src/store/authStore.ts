import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  _id: string;
  username: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      setAuth: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

// Add storage event listener
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    console.log("Storage event:", e);
  });
}
