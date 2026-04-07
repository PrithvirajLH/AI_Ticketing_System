"use client";

import { useEffect, useState } from "react";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { TeamWorkload } from "@/components/dashboard/team-workload";
import { StatusChart } from "@/components/dashboard/status-chart";
import { RecentTickets } from "@/components/dashboard/recent-tickets";

interface DashboardData {
  kpis: {
    total: number;
    open: number;
    resolved: number;
    newToday: number;
    unassigned: number;
  };
  teamWorkload: { name: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  recentTickets: {
    id: string;
    number: number;
    displayId: string | null;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    assignedTeam: { name: string } | null;
    requester: { displayName: string } | null;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="py-6 px-6 space-y-6">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your service desk
          </p>
        </div>

        {/* KPI Cards */}
        <KpiCards data={data.kpis} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriorityChart data={data.priorityBreakdown} />
          <TeamWorkload data={data.teamWorkload} />
        </div>

        {/* Status + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusChart data={data.statusBreakdown} />
          <RecentTickets tickets={data.recentTickets} />
        </div>
      </div>
    </div>
  );
}
