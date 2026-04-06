import { getSupabase } from "@/lib/db/supabase";
import type { ToolResult } from "../types";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  department: string | null;
  location: string | null;
  role: string;
  primaryTeamId: string | null;
}

interface UserTicketSummary {
  id: string;
  number: number;
  subject: string;
  status: string;
  priority: string;
  assignedTeamName: string | null;
  categoryName: string | null;
  createdAt: string;
}

export async function getUserProfile(
  userId: string
): Promise<ToolResult<UserProfile>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("User")
      .select("id, email, displayName, department, location, role, primaryTeamId")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return { success: false, error: `User not found: ${userId}` };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch user profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function getUserHistory(
  userId: string
): Promise<ToolResult<UserTicketSummary[]>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("Ticket")
      .select(`
        id, number, subject, status, priority, createdAt,
        Team:assignedTeamId ( name ),
        Category:categoryId ( name )
      `)
      .eq("requesterId", userId)
      .order("createdAt", { ascending: false })
      .limit(10);

    if (error) {
      return { success: false, error: `Failed to fetch history: ${error.message}` };
    }

    const tickets: UserTicketSummary[] = (data ?? []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      number: t.number as number,
      subject: t.subject as string,
      status: t.status as string,
      priority: t.priority as string,
      assignedTeamName: (t.Team as { name: string } | null)?.name ?? null,
      categoryName: (t.Category as { name: string } | null)?.name ?? null,
      createdAt: t.createdAt as string,
    }));

    return { success: true, data: tickets };
  } catch (error) {
    return {
      success: false,
      error: `Failed to fetch user history: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
