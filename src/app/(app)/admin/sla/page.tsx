"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Save } from "lucide-react";

interface SlaTarget {
  id: string;
  policyConfigId: string;
  priority: string;
  firstResponseHours: number;
  resolutionHours: number;
}

interface SlaPolicy {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  enabled: boolean;
  escalationEnabled: boolean;
  escalationAfterPercent: number;
  targets: SlaTarget[];
}

export default function SlaPage() {
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTargets, setEditingTargets] = useState<Record<string, SlaTarget>>({});
  const [saving, setSaving] = useState(false);

  async function loadData() {
    const res = await fetch("/api/sla");
    const data = await res.json();
    setPolicies(data.policies ?? []);
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function handleTargetChange(targetId: string, field: string, value: number) {
    setEditingTargets((prev) => {
      const existing = prev[targetId] ?? policies.flatMap((p) => p.targets).find((t) => t.id === targetId)!;
      return { ...prev, [targetId]: { ...existing, [field]: value } };
    });
  }

  async function saveTarget(targetId: string) {
    const target = editingTargets[targetId];
    if (!target) return;

    setSaving(true);
    await fetch("/api/sla", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetId,
        firstResponseHours: target.firstResponseHours,
        resolutionHours: target.resolutionHours,
      }),
    });

    setEditingTargets((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
    setSaving(false);
    loadData();
  }

  async function togglePolicy(policyId: string, enabled: boolean) {
    await fetch("/api/sla", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyId, enabled }),
    });
    loadData();
  }

  if (isLoading) return <p className="text-muted-foreground">Loading SLA settings...</p>;

  return (
    <div className="space-y-6">
      {policies.map((policy) => (
        <Card key={policy.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/10 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-medium">{policy.name}</h3>
                  {policy.description ? (
                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {policy.isDefault ? (
                  <Badge>Default</Badge>
                ) : null}
                <div className="flex items-center gap-2">
                  <Label htmlFor={`enabled-${policy.id}`} className="text-sm">Enabled</Label>
                  <Switch
                    id={`enabled-${policy.id}`}
                    checked={policy.enabled}
                    onCheckedChange={(checked) => togglePolicy(policy.id, checked)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Priority</TableHead>
                  <TableHead>First Response (hours)</TableHead>
                  <TableHead>Resolution (hours)</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {policy.targets.map((target) => {
                  const edited = editingTargets[target.id];
                  const frh = edited?.firstResponseHours ?? target.firstResponseHours;
                  const rh = edited?.resolutionHours ?? target.resolutionHours;
                  const isEdited = !!edited;

                  return (
                    <TableRow key={target.id}>
                      <TableCell>
                        <Badge variant="outline">{target.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={frh}
                          onChange={(e) =>
                            handleTargetChange(target.id, "firstResponseHours", parseInt(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={rh}
                          onChange={(e) =>
                            handleTargetChange(target.id, "resolutionHours", parseInt(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        {isEdited ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveTarget(target.id)}
                            disabled={saving}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Escalation: {policy.escalationEnabled ? `at ${policy.escalationAfterPercent}%` : "Disabled"}</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {policies.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No SLA policies configured</p>
      ) : null}
    </div>
  );
}
