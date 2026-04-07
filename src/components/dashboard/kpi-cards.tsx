"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Inbox, CheckCircle2, AlertTriangle, Clock, UserX } from "lucide-react";

interface KpiData {
  total: number;
  open: number;
  resolved: number;
  newToday: number;
  unassigned: number;
}

interface KpiCardsProps {
  data: KpiData;
}

const CARDS = [
  {
    key: "open" as const,
    label: "Open Tickets",
    icon: <Inbox className="h-5 w-5" />,
    color: "text-blue-600",
    bg: "bg-blue-500/10",
  },
  {
    key: "newToday" as const,
    label: "New (24h)",
    icon: <Clock className="h-5 w-5" />,
    color: "text-orange-600",
    bg: "bg-orange-500/10",
  },
  {
    key: "unassigned" as const,
    label: "Unassigned",
    icon: <UserX className="h-5 w-5" />,
    color: "text-red-600",
    bg: "bg-red-500/10",
  },
  {
    key: "resolved" as const,
    label: "Resolved",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-600",
    bg: "bg-green-500/10",
  },
  {
    key: "total" as const,
    label: "Total Tickets",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
];

export function KpiCards({ data }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {CARDS.map((card) => (
        <Card key={card.key}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`${card.bg} ${card.color} p-2 rounded-lg`}>
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{data[card.key]}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
