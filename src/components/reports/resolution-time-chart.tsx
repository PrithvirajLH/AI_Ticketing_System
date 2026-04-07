"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ResolutionTimeChartProps {
  data: { team: string; avgHours: number; count: number }[];
}

export function ResolutionTimeChart({ data }: ResolutionTimeChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">Avg Resolution Time by Team (hours)</h3>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="team" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="avgHours" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No resolved tickets yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
