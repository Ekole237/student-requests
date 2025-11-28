import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { AppRole } from "@/lib/types";

interface UserState {
  userRole: AppRole | null;
  isAdmin: boolean;
  fetchUserRole: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  userRole: null,
  isAdmin: false,
  fetchUserRole: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: isAdmin, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("Error checking user role:", error);
        set({ userRole: null, isAdmin: false });
      } else {
        set({ userRole: isAdmin ? "admin" : "student", isAdmin });
      }
    } else {
      set({ userRole: null, isAdmin: false });
    }
  },
}));
