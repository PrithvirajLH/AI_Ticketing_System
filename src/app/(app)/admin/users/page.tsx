"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  department: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-red-50 text-red-700 border-red-200",
  TEAM_ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  LEAD: "bg-blue-50 text-blue-700 border-blue-200",
  AGENT: "bg-green-50 text-green-700 border-green-200",
  EMPLOYEE: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then((d) => { setUsers(d.users ?? []); setIsLoading(false); }).catch(() => setIsLoading(false));
  }, []);

  async function handleRoleChange(userId: string, role: string) {
    await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
  }

  if (isLoading) return <p className="text-muted-foreground">Loading users...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{users.length} user{users.length !== 1 ? "s" : ""}</p>

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="pt-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}{user.department ? ` · ${user.department}` : ""}</p>
                </div>
              </div>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                className={`h-8 rounded-md border px-2 text-xs font-medium ${ROLE_COLORS[user.role] ?? ""}`}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="AGENT">Agent</option>
                <option value="LEAD">Lead</option>
                <option value="TEAM_ADMIN">Team Admin</option>
                <option value="OWNER">Owner</option>
              </select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
