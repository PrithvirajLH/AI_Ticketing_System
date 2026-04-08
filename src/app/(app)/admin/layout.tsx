"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UserCog, Route, FolderTree, Clock, Zap, Shield, MessageSquareText } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin/teams", label: "Teams", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/routing", label: "Routing Rules", icon: <Route className="h-4 w-4" /> },
  { href: "/admin/categories", label: "Categories", icon: <FolderTree className="h-4 w-4" /> },
  { href: "/admin/sla", label: "SLA Settings", icon: <Clock className="h-4 w-4" /> },
  { href: "/admin/automation", label: "Automation", icon: <Zap className="h-4 w-4" /> },
  { href: "/admin/canned-responses", label: "Canned Responses", icon: <MessageSquareText className="h-4 w-4" /> },
  { href: "/admin/users", label: "Users", icon: <UserCog className="h-4 w-4" /> },
  { href: "/admin/audit-log", label: "Audit Log", icon: <Shield className="h-4 w-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="h-full overflow-y-auto">
      <div className="py-6 px-6 space-y-6">
        <div>
          <h1>Admin</h1>
          <p className="text-muted-foreground mt-1">Manage your service desk configuration</p>
        </div>

        <div className="flex gap-2 border-b pb-3">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
