import { create } from "zustand";
import type { AppRole, RequestPlatformPermission } from "@/lib/types";
import { getCurrentUser } from "@/app/actions/user";
import { getUserPermissions, hasPermission } from "@/lib/permissions";

interface UserState {
  userRole: AppRole | null;
  isAdmin: boolean;
  userName: string | null;
  userEmail: string | null;
  userMatricule: string | null;
  requestPermissions: RequestPlatformPermission[];
  fetchUserRole: () => Promise<void>;
  clearUser: () => void;
  hasPermission: (permission: RequestPlatformPermission) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  userRole: null,
  isAdmin: false,
  userName: null,
  userEmail: null,
  userMatricule: null,
  requestPermissions: [],
  clearUser: () => {
    console.log('Clearing user from store');
    set({
      userRole: null,
      isAdmin: false,
      userName: null,
      userEmail: null,
      userMatricule: null,
      requestPermissions: [],
    });
  },
  hasPermission: (permission: RequestPlatformPermission) => {
    const state = get();
    if (state.requestPermissions.includes('*')) {
      return true;
    }
    return state.requestPermissions.includes(permission);
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
        
        // Get permissions for this user
        const permissions = getUserPermissions(user);
        
        console.log('User store - setting state:', {
          email: user.email,
          fullName,
          role: appRole,
          permissions,
        });
        
        set({
          userRole: appRole,
          isAdmin,
          userName: fullName,
          userEmail: user.email,
          userMatricule: user.matricule,
          requestPermissions: permissions,
        });
      } else {
        console.log('No user found, clearing state');
        set({ 
          userRole: null, 
          isAdmin: false, 
          userName: null, 
          userEmail: null,
          userMatricule: null,
          requestPermissions: [],
        });
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      set({ 
        userRole: null, 
        isAdmin: false, 
        userName: null, 
        userEmail: null,
        userMatricule: null,
        requestPermissions: [],
      });
    }
  },
}));
