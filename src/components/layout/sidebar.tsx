"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquarePlus,
  Inbox,
  LayoutDashboard,
  Bug,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/submit",
    label: "New Request",
    icon: <MessageSquarePlus className="h-5 w-5" />,
    section: "main",
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: <Inbox className="h-5 w-5" />,
    section: "main",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    section: "main",
  },
  {
    href: "/debug",
    label: "Pipeline Debug",
    icon: <Bug className="h-5 w-5" />,
    section: "dev",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const mainItems = NAV_ITEMS.filter((i) => i.section === "main");
  const devItems = NAV_ITEMS.filter((i) => i.section === "dev");

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
          AI
        </div>
        {!collapsed ? (
          <span className="font-semibold text-sm truncate">Ticket Master</span>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-1 px-2">
        {mainItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}

        {devItems.length > 0 ? (
          <>
            <div className="pt-4 pb-1 px-3">
              {!collapsed ? (
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Developer
                </span>
              ) : (
                <div className="border-t" />
              )}
            </div>
            {devItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </>
        ) : null}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-md py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
