import { create } from "zustand";
import type { AppRole } from "@/lib/types";

interface UserState {
  userRole: AppRole | null;
  isAdmin: boolean;
  userName: string | null;
  userEmail: string | null;
  fetchUserRole: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  userRole: null,
  isAdmin: false,
  userName: null,
  userEmail: null,
  fetchUserRole: async () => {
    try {
      // Fetch user info from the verify endpoint using the token from cookies
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        set({ userRole: null, isAdmin: false, userName: null, userEmail: null });
        return;
      }

      const result = await response.json();

      if (result?.valid && result.user) {
        const user = result.user;
        const roleName = user.role?.name || "student";
        const isAdmin = roleName === "admin";
        const roleMap: Record<string, AppRole> = {
          etudiant: "student",
          enseignant: "teacher",
          responsable_pedagogique: "department_head",
          directeur: "department_head",
          admin: "admin",
        };
        
        const appRole = (roleMap[roleName] || "student") as AppRole;
        
        set({
          userRole: appRole,
          isAdmin,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
        });
      } else {
        set({ userRole: null, isAdmin: false, userName: null, userEmail: null });
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      set({ userRole: null, isAdmin: false, userName: null, userEmail: null });
    }
  },
}));
