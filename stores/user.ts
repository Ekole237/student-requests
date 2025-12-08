import { create } from "zustand";
import type { AppRole } from "@/lib/types";
import { getCurrentUser } from "@/app/actions/user";

interface UserState {
  userRole: AppRole | null;
  isAdmin: boolean;
  userName: string | null;
  userEmail: string | null;
  userMatricule: string | null;
  fetchUserRole: () => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userRole: null,
  isAdmin: false,
  userName: null,
  userEmail: null,
  userMatricule: null,
  clearUser: () => {
    console.log('Clearing user from store');
    set({
      userRole: null,
      isAdmin: false,
      userName: null,
      userEmail: null,
      userMatricule: null,
    });
  },
  fetchUserRole: async () => {
    try {
      console.log('fetchUserRole called from client');
      
      // Call server action to get user data
      const user = await getCurrentUser();
      
      console.log('User from server action:', user);

      if (user && user.email) {
        const roleName = user.role?.name || "etudiant";
        const isAdmin = roleName === "admin";
        const roleMap: Record<string, AppRole> = {
          etudiant: "student",
          enseignant: "teacher",
          responsable_pedagogique: "department_head",
          directeur: "department_head",
          admin: "admin",
        };
        
        const appRole = (roleMap[roleName] || "student") as AppRole;
        const fullName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.email;
        
        console.log('User store - setting state:', {
          email: user.email,
          fullName,
          role: appRole,
        });
        
        set({
          userRole: appRole,
          isAdmin,
          userName: fullName,
          userEmail: user.email,
          userMatricule: user.matricule,
        });
      } else {
        console.log('No user found, clearing state');
        set({ 
          userRole: null, 
          isAdmin: false, 
          userName: null, 
          userEmail: null,
          userMatricule: null 
        });
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      set({ 
        userRole: null, 
        isAdmin: false, 
        userName: null, 
        userEmail: null,
        userMatricule: null 
      });
    }
  },
}));
