"use client";

import { BellIcon, Menu} from "lucide-react";
import { Suspense } from "react";
import { AuthButton } from "./auth-button";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <header className="h-16 shadow flex items-center justify-between px-4 lg:px-6 border-b gap-2">
      <Button
        className="lg:hidden text-2xl"
        onClick={onMenuClick}
        size={'icon'}
      >
        <Menu className="h-4 w-4"/>
      </Button>

      <div className="flex-1"></div>

      <button className="relative mr-4">
        <BellIcon className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <ThemeSwitcher />
      <Suspense>
        <AuthButton />
      </Suspense>
    </header>
  );
}
