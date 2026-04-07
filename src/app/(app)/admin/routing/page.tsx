"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Route } from "lucide-react";

interface RoutingRule {
  id: string;
  name: string;
  keywords: string[];
  teamId: string;
  teamName: string;
  priority: number;
  isActive: boolean;
}

interface Team {
  id: string;
  name: string;
}

export default function RoutingPage() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadData() {
    const [rulesRes, teamsRes] = await Promise.all([
      fetch("/api/routing"),
      fetch("/api/teams"),
    ]);
    const rulesData = await rulesRes.json();
    const teamsData = await teamsRes.json();
    setRules(rulesData.rules ?? []);
    setTeams(teamsData.teams ?? []);
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const keywordsStr = form.get("keywords") as string;

    await fetch("/api/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        keywords: keywordsStr.split(",").map((k) => k.trim()).filter(Boolean),
        teamId: form.get("teamId"),
        priority: parseInt(form.get("priority") as string) || 100,
      }),
    });

    setDialogOpen(false);
    loadData();
  }

  if (isLoading) return <p className="text-muted-foreground">Loading routing rules...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{rules.length} routing rule{rules.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Rule</Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Routing Rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" required placeholder="e.g. IT access and devices" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input id="keywords" name="keywords" required placeholder="vpn, laptop, device, it" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamId">Route to Team</Label>
                <select
                  name="teamId"
                  required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority (lower = higher priority)</Label>
                <Input id="priority" name="priority" type="number" defaultValue="100" />
              </div>
              <Button type="submit" className="w-full mt-2">Create Rule</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                  <Route className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">{rule.name}</p>
                  <div className="flex gap-1 mt-1">
                    {rule.keywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{rule.teamName}</span>
                <Badge variant="outline" className="text-xs">Priority: {rule.priority}</Badge>
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
    </div>
  );
}
