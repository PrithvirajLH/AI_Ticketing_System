"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Zap } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: unknown[];
  actions: unknown[];
  isActive: boolean;
  priority: number;
  teamName: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  TICKET_CREATED: "Ticket Created",
  STATUS_CHANGED: "Status Changed",
  SLA_APPROACHING: "SLA At Risk",
  SLA_BREACHED: "SLA Breached",
};

const ACTION_LABELS: Record<string, string> = {
  assign_team: "Assign to Team",
  assign_user: "Assign to User",
  set_priority: "Set Priority",
  set_status: "Set Status",
  notify_team_lead: "Notify Team Lead",
  add_internal_note: "Add Internal Note",
};

export default function AutomationPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadData() {
    const res = await fetch("/api/automation");
    const data = await res.json();
    setRules(data.rules ?? []);
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const actionType = form.get("actionType") as string;
    const actionValue = form.get("actionValue") as string;

    const action: Record<string, string> = { type: actionType };
    if (actionType === "set_priority") action.priority = actionValue;
    if (actionType === "set_status") action.status = actionValue;
    if (actionType === "add_internal_note") action.body = actionValue;
    if (actionType === "notify_team_lead") action.body = actionValue;

    await fetch("/api/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || null,
        trigger: form.get("trigger"),
        conditions: [],
        actions: [action],
        priority: parseInt(form.get("priority") as string) || 0,
        createdById: "a89f9497-b330-47ad-9136-65a5e4e5abd8",
      }),
    });

    setDialogOpen(false);
    loadData();
  }

  if (isLoading) return <p className="text-muted-foreground">Loading automation rules...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rules.length} automation rule{rules.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Automation Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Escalate P1 tickets" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={2} placeholder="What does this rule do?" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select name="trigger" required>
                  <SelectTrigger><SelectValue placeholder="When..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionType">Action</Label>
                <Select name="actionType" required>
                  <SelectTrigger><SelectValue placeholder="Do..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionValue">Action Value</Label>
                <Input id="actionValue" name="actionValue" placeholder="e.g. P1, ASSIGNED, or note text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (lower = runs first)</Label>
                <Input id="priority" name="priority" type="number" defaultValue="0" />
              </div>
              <Button type="submit" className="w-full mt-2">Create Rule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No automation rules yet</p>
          <p className="text-sm">Create rules to auto-assign, notify, or update tickets on events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/10 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    {rule.description ? (
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    ) : null}
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {TRIGGER_LABELS[rule.trigger] ?? rule.trigger}
                      </Badge>
                      {(rule.actions as { type: string }[]).map((a, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {ACTION_LABELS[a.type] ?? a.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{rule.teamName}</span>
                  <Badge
                    variant="outline"
                    className={rule.isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : ""}
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
