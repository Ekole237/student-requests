"use client";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useUserStore } from "@/stores/user";

export function LogoutButton() {
  const { clearUser } = useUserStore();

  const handleLogout = async () => {
    console.log('Logout button clicked');
    // Clear the store first
    clearUser();
    // Then call the logout action
    await logout();
  };

  return (
    <form action={logout} className="w-full">
      <Button 
        type="submit" 
        variant="ghost"
        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="w-4 h-4" />
        <span>Se déconnecter</span>
      </Button>
    </form>
  );
}
