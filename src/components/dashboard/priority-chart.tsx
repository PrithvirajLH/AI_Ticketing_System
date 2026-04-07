"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PriorityItem {
  priority: string;
  count: number;
}

interface PriorityChartProps {
  data: PriorityItem[];
}

const COLORS: Record<string, string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#3b82f6",
  P4: "#9ca3af",
};

export function PriorityChart({ data }: PriorityChartProps) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">Open by Priority</h3>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.priority}
                    fill={COLORS[entry.priority] ?? "#6b7280"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                formatter={(value: string) => (
                  <span className="text-sm">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
            No open tickets
          </div>
        )}
      </CardContent>
    </Card>
  );
}
