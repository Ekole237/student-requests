"use client";

import { useState, ReactNode, useEffect, Suspense } from "react";
import SideNavigation from "./SideNavigation";
import Navbar from "./NavBar";
import Breadcrumb from "./Breadcrumb";
import type { AppRole } from "@/lib/types";
import { useUserStore } from "@/stores/user";

function DashboardContent({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { fetchUserRole, isAdmin, userRole } = useUserStore();

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  return (
    <div className="h-screen flex bg-background">
      <SideNavigation 
        open={open} 
        onClose={() => setOpen(false)} 
        isAdmin={isAdmin}
        userRole={(userRole || "student") as AppRole}
      />

      <div className="flex-1 flex flex-col">
        <Navbar onMenuClick={() => setOpen(true)} />
        <Breadcrumb />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-screen bg-background" />}>
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
