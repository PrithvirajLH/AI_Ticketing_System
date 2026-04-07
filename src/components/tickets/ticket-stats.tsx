"use client";

import { useEffect, useState } from "react";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Inbox, UserCheck, UserX, AlertTriangle } from "lucide-react";

interface Counts {
  all: number;
  assigned: number;
  unassigned: number;
  urgent: number;
}

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

export function TicketStats() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch(`/api/tickets/counts?userId=${CURRENT_USER_ID}`)
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
  }, []);

  if (!counts) return null;

  const stats = [
    { label: "Open", value: counts.all, icon: <Inbox className="h-4 w-4" />, color: "text-blue-600" },
    { label: "My Tickets", value: counts.assigned, icon: <UserCheck className="h-4 w-4" />, color: "text-green-600" },
    { label: "Unassigned", value: counts.unassigned, icon: <UserX className="h-4 w-4" />, color: "text-orange-600" },
    { label: "Urgent", value: counts.urgent, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
        >
          <span className={`${stat.color} opacity-70`}>{stat.icon}</span>
          <div>
            <div className="text-xl font-bold tabular-nums">
              {stat.value > 0 ? (
                <NumberTicker value={stat.value} />
              ) : (
                "0"
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
