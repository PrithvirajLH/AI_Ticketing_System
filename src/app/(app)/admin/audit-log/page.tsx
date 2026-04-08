"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shield } from "lucide-react";

interface AuditEvent {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  actorEmail: string | null;
  actorName: string | null;
  teamName: string | null;
  createdAt: string;
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const res = await fetch(`/api/audit-log?page=${page}&pageSize=20`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setTotal(data.total ?? 0);
      setIsLoading(false);
    }
    load();
  }, [page]);

  const totalPages = Math.ceil(total / 20);

  function formatTime(dateStr: string): string {
    const raw = dateStr;
    const date = new Date(raw.endsWith("Z") || raw.includes("+") ? raw : raw + "Z");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{total} audit event{total !== 1 ? "s" : ""}</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-8 text-center">Loading audit log...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Shield className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No audit events yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.actorName ?? event.actorEmail ?? "System"}
                      {event.teamName ? ` · ${event.teamName}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{formatTime(event.createdAt)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
