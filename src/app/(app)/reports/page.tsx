"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VolumeChart } from "@/components/reports/volume-chart";
import { SlaComplianceChart } from "@/components/reports/sla-compliance-chart";
import { ResolutionTimeChart } from "@/components/reports/resolution-time-chart";
import { AgentPerformanceTable } from "@/components/reports/agent-performance-table";
import { FileText, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface ReportsData {
  ticketVolume: { date: string; created: number; resolved: number }[];
  resolutionTimes: { team: string; avgHours: number; count: number }[];
  slaCompliance: { priority: string; met: number; breached: number; rate: number }[];
  agentPerformance: { name: string; assigned: number; resolved: number; avgResolutionHours: number | null; resolveRate: number }[];
  byChannel: { channel: string; count: number }[];
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Failed to load reports</p>
      </div>
    );
  }

  const overallSlaRate = data.slaCompliance.reduce((sum, s) => sum + s.met, 0) /
    Math.max(data.slaCompliance.reduce((sum, s) => sum + s.met + s.breached, 0), 1) * 100;

  return (
    <div className="h-full overflow-y-auto">
      <div className="py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1>Reports</h1>
            <p className="text-muted-foreground mt-1">
              Analytics and performance metrics
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Total Tickets</span>
              </div>
              <p className="text-2xl font-bold">{data.totalTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-xs text-muted-foreground">Open</span>
              </div>
              <p className="text-2xl font-bold">{data.openTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Resolved</span>
              </div>
              <p className="text-2xl font-bold">{data.resolvedTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-muted-foreground">SLA Compliance</span>
              </div>
              <p className={`text-2xl font-bold ${overallSlaRate >= 90 ? "text-green-600" : overallSlaRate >= 70 ? "text-orange-600" : "text-red-600"}`}>
                {Math.round(overallSlaRate)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Volume chart — full width */}
        <VolumeChart data={data.ticketVolume} />

        {/* SLA + Resolution side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SlaComplianceChart data={data.slaCompliance} />
          <ResolutionTimeChart data={data.resolutionTimes} />
        </div>

        {/* Agent performance — full width */}
        <AgentPerformanceTable data={data.agentPerformance} />
      </div>
    </div>
  );
}
