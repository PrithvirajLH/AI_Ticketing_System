"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Agent {
  name: string;
  assigned: number;
  resolved: number;
  avgResolutionHours: number | null;
  resolveRate: number;
}

interface AgentPerformanceTableProps {
  data: Agent[];
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function AgentPerformanceTable({ data }: AgentPerformanceTableProps) {
  const sorted = [...data].sort((a, b) => b.assigned - a.assigned);

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-medium">Agent Performance</h3>
      </CardHeader>
      <CardContent>
        {sorted.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">Resolve Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((agent) => (
                <TableRow key={agent.name}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">{agent.assigned}</TableCell>
                  <TableCell className="text-right text-sm">{agent.resolved}</TableCell>
                  <TableCell className="text-right text-sm">
                    {agent.avgResolutionHours !== null ? `${agent.avgResolutionHours}h` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        agent.resolveRate >= 80
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : agent.resolveRate >= 50
                            ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                            : "bg-red-500/10 text-red-600 border-red-500/20"
                      }
                    >
                      {agent.resolveRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No agent data yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
