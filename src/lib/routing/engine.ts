import { getSupabase } from "@/lib/db/supabase";

interface RoutingResult {
  teamId: string;
  teamName: string;
  assigneeId: string | null;
  matchedRule: string | null;
  method: "ai_classification" | "keyword_match" | "fallback";
}

interface RoutingRule {
  id: string;
  name: string;
  keywords: string[];
  teamId: string;
  teamName: string;
  priority: number;
  assigneeId: string | null;
  assignmentStrategy: string;
}

/**
 * Routes a ticket to the correct team using a 3-tier strategy:
 *
 * 1. AI Classification — if the pipeline already classified a team, use it
 * 2. Keyword Matching — match subject/description against routing rules
 * 3. Fallback — assign to a default team if nothing matches
 */
export async function routeTicket(input: {
  subject: string;
  description: string;
  aiTeamId?: string | null;
  aiTeamName?: string | null;
}): Promise<RoutingResult> {
  const supabase = getSupabase();

  // ── Tier 1: AI Classification ──────────────────────────────────────────
  // If the AI pipeline already assigned a team, verify it exists and use it
  if (input.aiTeamId) {
    const { data: team } = await supabase
      .from("Team")
      .select("id, name, assignmentStrategy")
      .eq("id", input.aiTeamId)
      .eq("isActive", true)
      .single();

    if (team) {
      const assigneeId = await resolveAssignee(team.id, team.assignmentStrategy);
      return {
        teamId: team.id,
        teamName: team.name,
        assigneeId,
        matchedRule: null,
        method: "ai_classification",
      };
    }
  }

  // ── Tier 2: Keyword Matching ───────────────────────────────────────────
  const { data: rules } = await supabase
    .from("RoutingRule")
    .select(`
      id, name, keywords, priority, assigneeId,
      Team:teamId ( id, name, assignmentStrategy )
    `)
    .eq("isActive", true)
    .order("priority", { ascending: true });

  if (rules && rules.length > 0) {
    const text = `${input.subject} ${input.description}`.toLowerCase();

    for (const rule of rules) {
      const team = rule.Team as unknown as { id: string; name: string; assignmentStrategy: string } | null;
      if (!team) continue;

      const keywords = rule.keywords as string[];
      const matched = keywords.some((kw) => text.includes(kw.toLowerCase()));

      if (matched) {
        const assigneeId = rule.assigneeId ?? await resolveAssignee(team.id, team.assignmentStrategy);
        return {
          teamId: team.id,
          teamName: team.name,
          assigneeId,
          matchedRule: rule.name,
          method: "keyword_match",
        };
      }
    }
  }

  // ── Tier 3: Fallback ───────────────────────────────────────────────────
  // Assign to IT Service Desk as default, or the first active team
  const { data: fallbackTeam } = await supabase
    .from("Team")
    .select("id, name, assignmentStrategy")
    .eq("isActive", true)
    .order("name")
    .limit(1)
    .single();

  if (fallbackTeam) {
    return {
      teamId: fallbackTeam.id,
      teamName: fallbackTeam.name,
      assigneeId: null,
      matchedRule: null,
      method: "fallback",
    };
  }

  throw new Error("No active teams found for routing");
}

/**
 * Resolves an assignee based on the team's assignment strategy.
 * QUEUE_ONLY: no auto-assignment (returns null)
 * ROUND_ROBIN: assigns to the next agent in rotation
 */
async function resolveAssignee(
  teamId: string,
  strategy: string
): Promise<string | null> {
  if (strategy !== "ROUND_ROBIN") return null;

  const supabase = getSupabase();

  // Get the team's last assigned user
  const { data: team } = await supabase
    .from("Team")
    .select("lastAssignedUserId")
    .eq("id", teamId)
    .single();

  // Get active team members
  const { data: members } = await supabase
    .from("TeamMember")
    .select("userId")
    .eq("teamId", teamId)
    .order("createdAt", { ascending: true });

  if (!members || members.length === 0) return null;

  // Find next member after lastAssignedUserId
  const lastId = team?.lastAssignedUserId;
  let nextUserId = members[0].userId;

  if (lastId) {
    const lastIndex = members.findIndex((m) => m.userId === lastId);
    if (lastIndex >= 0 && lastIndex < members.length - 1) {
      nextUserId = members[lastIndex + 1].userId;
    }
  }

  // Update the team's lastAssignedUserId
  await supabase
    .from("Team")
    .update({
      lastAssignedUserId: nextUserId,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", teamId);

  return nextUserId;
}
