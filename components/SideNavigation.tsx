"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronRight,
  LayoutDashboard,
  Users,
  Building2,
  List,
  User, // Imported User icon
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  isAdminOnly?: boolean;
}

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
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (itemName: string) => {
    setExpanded((prev) => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  const navItems: NavItem[] = [
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: <User size={18} />,
    },
    {
      name: "Mes Requêtes",
      href: "/dashboard",
      icon: <List size={18} />,
    },
    {
      name: "Administration",
      href: "/admin", // This will be the admin requests page by default
      icon: <LayoutDashboard size={18} />,
      isAdminOnly: true,
      children: [
        {
          name: "Requêtes",
          href: "/admin",
          icon: <List size={18} />,
        },
        {
          name: "Étudiants",
          href: "/admin/students",
          icon: <Users size={18} />,
        },
        {
          name: "Départements",
          href: "/admin/departments",
          icon: <Building2 size={18} />,
        },
      ],
    },
  ];

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item) => {
      const isActive = item.href === pathname || (item.children && pathname.startsWith(item.href));
      const isExpanded = expanded[item.name] || isActive;

      if (item.isAdminOnly && !isAdmin) {
        return null;
      }

      if (item.children) {
        return (
          <div key={item.name}>
            <button
              onClick={() => toggleExpand(item.name)}
              className={clsx(
                "nav-item flex items-center justify-between w-full",
                { "bg-gray-200": isActive && !isExpanded }, // Highlight parent if active but not expanded
                { "font-semibold": isActive },
              )}
            >
              <span className="flex items-center gap-2">
                {item.icon}
                {item.name}
              </span>
              <ChevronRight
                size={16}
                className={clsx("transition-transform duration-200", {
                  "rotate-90": isExpanded,
                })}
              />
            </button>
            {isExpanded && (
              <div className="ml-4 border-l pl-2 space-y-2">
                {renderNavItems(item.children)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx("nav-item flex items-center gap-2", {
              "bg-gray-200": isActive,
              "font-semibold": isActive,
            })}
            onClick={onClose} // Close sidebar on mobile when a link is clicked
          >
            {item.icon}
            {item.name}
          </Link>
        );
      }
    });
  };

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
          {renderNavItems(navItems)}
        </nav>
      </div>
    </aside>
  );
}
