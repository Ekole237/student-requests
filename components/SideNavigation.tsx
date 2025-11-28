"use client";

import Link from "next/link";
import clsx from "clsx";

interface SideNavigationProps {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export default function SideNavigation({
  open,
  onClose,
  isAdmin,
}: SideNavigationProps) {
  return (
    <aside
      className={clsx(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300",
        "lg:static lg:translate-x-0", // Desktop
        open ? "translate-x-0" : "-translate-x-full", // Mobile
      )}
    >
      <div className="p-4 flex justify-between items-center lg:hidden">
        <h2 className="text-xl font-semibold">Menu</h2>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="p-4">
        <h2 className="hidden lg:block text-2xl font-bold mb-6">Dashboard</h2>

        <nav className="flex flex-col gap-2">
          <Link href="/dashboard" className="nav-item">
            Mes Requêtes
          </Link>
          {isAdmin && (
            <Link href="/admin" className="nav-item">
              Admin
            </Link>
          )}
        </nav>
      </div>
    </aside>
  );
}
