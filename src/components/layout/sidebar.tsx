"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  MessageSquarePlus,
  Inbox,
  LayoutDashboard,
  Bug,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserX,
  UserCheck,
  Bell,
  BarChart3,
  Columns3,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { NotificationCenter } from "./notification-center";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on small screens
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    if (mq.matches) setCollapsed(true);
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [unassignedCount, setUnassignedCount] = useState<number | null>(null);
  const [assignedCount, setAssignedCount] = useState<number | null>(null);
  const [notifCount, setNotifCount] = useState(0);

  // Fetch counts
  useEffect(() => {
    async function loadCounts() {
      try {
        const res = await fetch(`/api/tickets/counts?userId=${CURRENT_USER_ID}`);
        const data = await res.json();
        setUnassignedCount(data.unassigned ?? 0);
        setAssignedCount(data.assigned ?? 0);
      } catch { /* ignore */ }

      try {
        const res = await fetch(`/api/notifications?userId=${CURRENT_USER_ID}`);
        const data = await res.json();
        setNotifCount(data.unreadCount ?? 0);
      } catch { /* ignore */ }
    }
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentScope = pathname === "/tickets" ? (searchParams.get("scope") ?? "all") : null;

  const isTicketsActive = pathname === "/tickets" || pathname.startsWith("/tickets/");
  const isUnassignedActive = pathname === "/tickets" && currentScope === "unassigned";
  const isAssignedActive = pathname === "/tickets" && currentScope === "assigned";
  const isMyTicketsActive = pathname === "/tickets" && currentScope === "created";
  const isCompletedActive = pathname === "/tickets" && currentScope === "completed";
  const isTicketsMainActive = isTicketsActive && !isUnassignedActive && !isAssignedActive && !isMyTicketsActive && !isCompletedActive;
  const isAdminActive = pathname.startsWith("/admin");

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
          <>
            <span className="font-semibold text-sm truncate flex-1">Ticket Master</span>
          </>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {/* New Request */}
        <NavLink href="/submit" icon={<MessageSquarePlus className="h-5 w-5" />} label="New Request" active={pathname === "/submit"} collapsed={collapsed} />

        {/* Tickets */}
        <NavLink href="/tickets" icon={<Inbox className="h-5 w-5" />} label="Tickets" active={isTicketsMainActive} collapsed={collapsed} />

        {/* Unassigned — sub-item under Tickets */}
        {!collapsed ? (
          <Link
            href="/tickets?scope=unassigned"
            className={cn(
              "flex items-center justify-between rounded-md pl-11 pr-3 py-2 text-sm font-medium transition-colors",
              isUnassignedActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              <span>Unassigned</span>
            </div>
            {unassignedCount !== null && unassignedCount > 0 ? (
              <span className={cn(
                "text-xs font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5",
                isUnassignedActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-orange-500/10 text-orange-600"
              )}>
                {unassignedCount}
              </span>
            ) : null}
          </Link>
        ) : (
          <Link
            href="/tickets?scope=unassigned"
            className={cn(
              "flex items-center justify-center rounded-md py-2 transition-colors",
              isUnassignedActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Unassigned"
          >
            <div className="relative">
              <UserX className="h-5 w-5" />
              {unassignedCount !== null && unassignedCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">
                  {unassignedCount}
                </span>
              ) : null}
            </div>
          </Link>
        )}

        {/* Assigned to Me — sub-item under Tickets */}
        {!collapsed ? (
          <Link
            href="/tickets?scope=assigned"
            className={cn(
              "flex items-center justify-between rounded-md pl-11 pr-3 py-2 text-sm font-medium transition-colors",
              isAssignedActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>Assigned to Me</span>
            </div>
            {assignedCount !== null && assignedCount > 0 ? (
              <span className={cn(
                "text-xs font-semibold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5",
                isAssignedActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-blue-500/10 text-blue-600"
              )}>
                {assignedCount}
              </span>
            ) : null}
          </Link>
        ) : (
          <Link
            href="/tickets?scope=assigned"
            className={cn(
              "flex items-center justify-center rounded-md py-2 transition-colors",
              isAssignedActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Assigned to Me"
          >
            <div className="relative">
              <UserCheck className="h-5 w-5" />
              {assignedCount !== null && assignedCount > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[9px] font-bold min-w-[14px] h-[14px] flex items-center justify-center rounded-full px-0.5">
                  {assignedCount}
                </span>
              ) : null}
            </div>
          </Link>
        )}

        {/* My Tickets (created by me) */}
        {!collapsed ? (
          <Link
            href="/tickets?scope=created"
            className={cn(
              "flex items-center gap-2 rounded-md pl-11 pr-3 py-2 text-sm font-medium transition-colors",
              isMyTicketsActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>My Tickets</span>
          </Link>
        ) : null}

        {/* Completed */}
        {!collapsed ? (
          <Link
            href="/tickets?scope=completed"
            className={cn(
              "flex items-center gap-2 rounded-md pl-11 pr-3 py-2 text-sm font-medium transition-colors",
              isCompletedActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <CheckCircle className="h-4 w-4" />
            <span>Completed</span>
          </Link>
        ) : null}

        {/* Triage Board */}
        <NavLink href="/triage" icon={<Columns3 className="h-5 w-5" />} label="Triage Board" active={pathname === "/triage"} collapsed={collapsed} />

        {/* Dashboard */}
        <NavLink href="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" active={pathname === "/dashboard"} collapsed={collapsed} />

        {/* Reports */}
        <NavLink href="/reports" icon={<BarChart3 className="h-5 w-5" />} label="Reports" active={pathname === "/reports"} collapsed={collapsed} />

        {/* Admin */}
        <NavLink href="/admin/teams" icon={<Settings className="h-5 w-5" />} label="Admin" active={isAdminActive} collapsed={collapsed} />

        {/* Dev section */}
        <div className="pt-4 pb-1 px-3">
          {!collapsed ? (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Developer
            </span>
          ) : (
            <div className="border-t" />
          )}
        </div>
        <NavLink href="/debug" icon={<Bug className="h-5 w-5" />} label="Pipeline Debug" active={pathname === "/debug"} collapsed={collapsed} />
      </nav>

      {/* User + Collapse */}
      <div className="border-t p-2 space-y-1">
        {session?.user ? (
          <div className={cn(
            "flex items-center gap-2 rounded-md px-2 py-2",
            collapsed ? "justify-center" : ""
          )}>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs">
                {getInitials(session.user.displayName ?? session.user.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            {!collapsed ? (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {session.user.displayName ?? session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.role ?? "User"}
                </p>
              </div>
            ) : null}
            {!collapsed ? (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full rounded-md py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

function NavLink({ href, icon, label, active, collapsed }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}
