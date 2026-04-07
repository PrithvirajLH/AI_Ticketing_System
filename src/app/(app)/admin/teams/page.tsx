"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  assignmentStrategy: string;
}

interface Member {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(data.teams ?? []);
      setIsLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
      setMembers([]);
      return;
    }
    async function loadMembers() {
      const res = await fetch(`/api/teams/${selectedTeam}/members`);
      const data = await res.json();
      setMembers(data.members ?? []);
    }
    loadMembers();
  }, [selectedTeam]);

  if (isLoading) return <p className="text-muted-foreground">Loading teams...</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        {teams.map((team) => (
          <Card
            key={team.id}
            className={`cursor-pointer transition-colors ${selectedTeam === team.id ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
            onClick={() => setSelectedTeam(team.id === selectedTeam ? null : team.id)}
          >
            <CardContent className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{team.name}</p>
                  <p className="text-sm text-muted-foreground">{team.description ?? team.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{(team.assignmentStrategy ?? "QUEUE_ONLY").replace("_", " ")}</Badge>
                {team.isActive ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-medium">
              {selectedTeam ? `Team Members` : "Select a team"}
            </h3>
          </CardHeader>
          <CardContent>
            {!selectedTeam ? (
              <p className="text-sm text-muted-foreground">Click a team to view members</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members in this team</p>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.displayName}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{m.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
