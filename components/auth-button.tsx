"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/user";
import { User, LogOut, Settings } from "lucide-react";

export function AuthButton() {
  const [isClient, setIsClient] = useState(false);
  const { userName, userEmail, userRole, fetchUserRole } = useUserStore();

  useEffect(() => {
    setIsClient(true);
    console.log('AuthButton mounted, fetching user role...');
    fetchUserRole();
  }, [fetchUserRole]);

  console.log('AuthButton render - userName:', userName, 'userEmail:', userEmail, 'userRole:', userRole, 'isClient:', isClient);

  if (!isClient) {
    return null;
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-3 pr-2">
        {/* User Info */}
        <div className="hidden sm:flex flex-col items-end text-sm">
          <div className="font-medium text-foreground">
            {userName || userEmail.split('@')[0]}
          </div>
          <div className="text-xs text-muted-foreground">
            {userRole && (
              <>
                {userRole === 'student' && '👨‍🎓 Étudiant'}
                {userRole === 'teacher' && '👨‍🏫 Enseignant'}
                {userRole === 'department_head' && '📊 Responsable'}
                {userRole === 'admin' && '👤 Admin'}
              </>
            )}
          </div>
        </div>

        {/* User Menu */}
        <div className="relative group">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
            <User className="w-5 h-5 text-primary" />
          </button>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-3 border-b border-border">
              <div className="font-medium text-sm">{userName || 'User'}</div>
              <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
              {userRole && (
                <div className="text-xs text-muted-foreground mt-1">
                  {userRole === 'student' && '👨‍🎓 Étudiant'}
                  {userRole === 'teacher' && '👨‍🏫 Enseignant'}
                  {userRole === 'department_head' && '📊 Responsable Pédagogique'}
                  {userRole === 'admin' && '👤 Administrateur'}
                </div>
              )}
            </div>

            <div className="p-2">
              <Link href="/dashboard/profile">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded transition-colors">
                  <User className="w-4 h-4" />
                  <span>Mon Profil</span>
                </button>
              </Link>

              <Link href="/dashboard/settings">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Paramètres</span>
                </button>
              </Link>
            </div>

            <div className="p-2 border-t border-border">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">
          <span className="hidden sm:inline">Se connecter</span>
          <span className="sm:hidden">Login</span>
        </Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">
          <span className="hidden sm:inline">S'inscrire</span>
          <span className="sm:hidden">Sign up</span>
        </Link>
      </Button>
    </div>
  );
}
