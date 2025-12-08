"use client";

import { Menu} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { AuthButton } from "./auth-button";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import NotificationList from "./notification-list";
import { useUserStore } from "@/stores/user";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const { userName, userEmail, fetchUserRole } = useUserStore();

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return (
    <header className="bg-background h-16 shadow flex items-center justify-between px-4 lg:px-6 border-b border-border-secondary">
      <Button
        className="lg:hidden text-2xl"
        onClick={onMenuClick}
        size={'icon'}
      >
        <Menu className="h-5 w-5"/>
      </Button>

      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        {userName && <NotificationList userId={userId || ""} />}

        <Suspense>
         <AuthButton />
        </Suspense>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
