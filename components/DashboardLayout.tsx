"use client";

import { useState, ReactNode, useEffect } from "react";
import SideNavigation from "./SideNavigation";
import Navbar from "./NavBar";
import Breadcrumb from "./Breadcrumb";
import { useUserStore } from "@/stores/user";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { fetchUserRole, isAdmin } = useUserStore();

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return (
    <div className="h-screen flex bg-gray-100">
      <SideNavigation open={open} onClose={() => setOpen(false)} isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setOpen(true)} />
        <Breadcrumb />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
