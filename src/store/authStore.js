import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      permissions: [],

      setAdmin: (admin, token, permissions = []) =>
        set({ admin, token, isAuthenticated: true, permissions }),

      logout: () =>
        set({ admin: null, token: null, isAuthenticated: false, permissions: [] }),

      hasPermission: (key) => {
        const state = useAuthStore.getState();
        if (state.admin?.role === "admin") return true;
        return state.permissions.includes(key);
      },
    }),
    { name: "admin-auth-storage" }
  )
);
