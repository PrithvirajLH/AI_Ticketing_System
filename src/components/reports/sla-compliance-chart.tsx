"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SlaComplianceChartProps {
  data: { priority: string; met: number; breached: number; rate: number }[];
}

export function SlaComplianceChart({ data }: SlaComplianceChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">SLA Compliance by Priority</h3>
      </CardHeader>
      <CardContent>
        {data.some((d) => d.met + d.breached > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data}>
              <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="met" name="Met" fill="#22c55e" stackId="sla" radius={[0, 0, 0, 0]} />
              <Bar dataKey="breached" name="Breached" fill="#ef4444" stackId="sla" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No SLA data yet
          </div>
        )}
        {/* Compliance rates */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {data.map((d) => (
            <div key={d.priority} className="text-center">
              <p className={`text-lg font-bold ${d.rate >= 90 ? "text-green-600" : d.rate >= 70 ? "text-orange-600" : "text-red-600"}`}>
                {d.rate}%
              </p>
              <p className="text-xs text-muted-foreground">{d.priority}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
