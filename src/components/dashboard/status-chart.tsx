"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface StatusItem {
  status: string;
  count: number;
}

interface StatusChartProps {
  data: StatusItem[];
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "#3b82f6",
  TRIAGED: "#a855f7",
  ASSIGNED: "#6366f1",
  IN_PROGRESS: "#eab308",
  WAITING_ON_REQUESTER: "#f97316",
  WAITING_ON_VENDOR: "#f97316",
  RESOLVED: "#22c55e",
  CLOSED: "#9ca3af",
  REOPENED: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  TRIAGED: "Triaged",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  WAITING_ON_REQUESTER: "Waiting",
  WAITING_ON_VENDOR: "Vendor",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
};

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.status] ?? d.status,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">All Tickets by Status</h3>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "#6b7280"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No tickets
          </div>
        )}
      </CardContent>
    </Card>
  );
}
