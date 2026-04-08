"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { VolumeChart } from "@/components/reports/volume-chart";
import { SlaComplianceChart } from "@/components/reports/sla-compliance-chart";
import { ResolutionTimeChart } from "@/components/reports/resolution-time-chart";
import { AgentPerformanceTable } from "@/components/reports/agent-performance-table";
import { FileText, TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react";

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

const DATE_RANGES = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "All time", value: 0 },
];

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/reports${range > 0 ? `?days=${range}` : ""}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [range]);

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
        {/* Header with date range + export */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Reports</h1>
            <p className="text-muted-foreground mt-1">Analytics and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date range selector */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              {DATE_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    range === r.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => window.open("/api/reports/export", "_blank")}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={<BarChart3 className="h-4 w-4 text-blue-600" />} label="Total Tickets" value={data.totalTickets} />
          <SummaryCard icon={<TrendingUp className="h-4 w-4 text-orange-600" />} label="Open" value={data.openTickets} />
          <SummaryCard icon={<TrendingDown className="h-4 w-4 text-green-600" />} label="Resolved" value={data.resolvedTickets} />
          <SummaryCard
            icon={<FileText className="h-4 w-4 text-purple-600" />}
            label="SLA Compliance"
            value={`${Math.round(overallSlaRate)}%`}
            color={overallSlaRate >= 90 ? "text-green-600" : overallSlaRate >= 70 ? "text-orange-600" : "text-red-600"}
          />
        </div>

        {/* Tabbed reports */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <VolumeChart data={data.ticketVolume} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SlaComplianceChart data={data.slaCompliance} />
              <ResolutionTimeChart data={data.resolutionTimes} />
            </div>
          </TabsContent>

          <TabsContent value="sla" className="space-y-6 mt-4">
            <SlaComplianceChart data={data.slaCompliance} />
          </TabsContent>

          <TabsContent value="volume" className="space-y-6 mt-4">
            <VolumeChart data={data.ticketVolume} />
            {/* Channel breakdown */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-sm font-medium mb-3">By Channel</h3>
                <div className="flex gap-6">
                  {data.byChannel.map((c) => (
                    <div key={c.channel}>
                      <p className="text-2xl font-bold">{c.count}</p>
                      <p className="text-xs text-muted-foreground">{c.channel}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="mt-4">
            <AgentPerformanceTable data={data.agentPerformance} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className={`text-2xl font-bold ${color ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
