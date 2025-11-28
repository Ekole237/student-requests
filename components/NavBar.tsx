"use client";

import { Menu} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { AuthButton } from "./auth-button";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import NotificationList from "./notification-list";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, [supabase]);

  return (
    <header className="bg-white h-16 shadow flex items-center justify-between px-4 lg:px-6">
      <Button
        className="lg:hidden text-2xl"
        onClick={onMenuClick}
        size={'icon'}
      >
        <Menu className="h-5 w-5"/>
      </Button>

      <div className="flex-1"></div>

      {user && <NotificationList userId={user.id} />}

      <Suspense>
        <AuthButton />
      </Suspense>
      <ThemeSwitcher />
    </header>
  );
}
