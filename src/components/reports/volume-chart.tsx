"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface VolumeChartProps {
  data: { date: string; created: number; resolved: number }[];
}

export function VolumeChart({ data }: VolumeChartProps) {
  // Show last 14 days only for readability
  const recent = data.slice(-14);

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">Ticket Volume (Last 14 Days)</h3>
      </CardHeader>
      <CardContent>
        {recent.some((d) => d.created > 0 || d.resolved > 0) ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={recent}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(v) => new Date(v as string).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              />
              <Area type="monotone" dataKey="created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
              <Area type="monotone" dataKey="resolved" stroke="#22c55e" fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            No ticket data in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
