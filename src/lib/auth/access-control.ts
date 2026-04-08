import { getSupabase } from "@/lib/db/supabase";

/**
 * Access Control for tickets based on user role.
 *
 * OWNER       → sees all tickets
 * TEAM_ADMIN  → sees tickets assigned to their primaryTeam + TicketAccess grants
 * LEAD        → sees tickets assigned to their team + TicketAccess grants
 * AGENT       → sees tickets assigned to their team (assigned to them or unassigned) + TicketAccess grants
 * EMPLOYEE    → sees only tickets they created (requesterId = self)
 */

interface User {
  id: string;
  role: string;
  primaryTeamId: string | null;
}

/**
 * Returns Supabase filter conditions for ticket visibility.
 * Apply this to any ticket query to enforce access control.
 */
export async function getAccessibleTicketIds(user: User): Promise<string[] | "all"> {
  if (user.role === "OWNER") return "all";

  const supabase = getSupabase();

  if (user.role === "EMPLOYEE") {
    // Employees only see their own tickets
    const { data } = await supabase
      .from("Ticket")
      .select("id")
      .eq("requesterId", user.id);
    return (data ?? []).map((t) => t.id);
  }

  // AGENT, LEAD, TEAM_ADMIN — see team tickets + access grants
  // First, find all teams the user belongs to
  const { data: memberships } = await supabase
    .from("TeamMember")
    .select("teamId")
    .eq("userId", user.id);

  const teamIds = (memberships ?? []).map((m) => m.teamId);

  // For TEAM_ADMIN, also include primaryTeam
  if (user.role === "TEAM_ADMIN" && user.primaryTeamId && !teamIds.includes(user.primaryTeamId)) {
    teamIds.push(user.primaryTeamId);
  }

  if (teamIds.length === 0) {
    // No team membership — can only see own tickets
    const { data } = await supabase
      .from("Ticket")
      .select("id")
      .eq("requesterId", user.id);
    return (data ?? []).map((t) => t.id);
  }

  // Get tickets assigned to user's teams
  const { data: teamTickets } = await supabase
    .from("Ticket")
    .select("id")
    .in("assignedTeamId", teamIds);

  // Get tickets with explicit access grants
  const { data: grantedAccess } = await supabase
    .from("TicketAccess")
    .select("ticketId")
    .in("teamId", teamIds);

  // Also include own tickets (as requester)
  const { data: ownTickets } = await supabase
    .from("Ticket")
    .select("id")
    .eq("requesterId", user.id);

  const idSet = new Set<string>();
  for (const t of teamTickets ?? []) idSet.add(t.id);
  for (const t of grantedAccess ?? []) idSet.add(t.ticketId);
  for (const t of ownTickets ?? []) idSet.add(t.id);

  return Array.from(idSet);
}

/**
 * Check if a user can view a specific ticket.
 */
export async function canViewTicket(user: User, ticketId: string): Promise<boolean> {
  const accessible = await getAccessibleTicketIds(user);
  if (accessible === "all") return true;
  return accessible.includes(ticketId);
}

/**
 * Check if a user can write/modify a specific ticket.
 */
export async function canWriteTicket(user: User, ticketId: string): Promise<boolean> {
  if (user.role === "OWNER") return true;

  const supabase = getSupabase();
  const { data: ticket } = await supabase
    .from("Ticket")
    .select("requesterId, assigneeId, assignedTeamId")
    .eq("id", ticketId)
    .single();

  if (!ticket) return false;

  // Employee can only modify own tickets
  if (user.role === "EMPLOYEE") {
    return ticket.requesterId === user.id;
  }

  // Check team membership
  const { data: memberships } = await supabase
    .from("TeamMember")
    .select("teamId")
    .eq("userId", user.id);

  const teamIds = (memberships ?? []).map((m) => m.teamId);

  if (user.role === "TEAM_ADMIN" && user.primaryTeamId) {
    teamIds.push(user.primaryTeamId);
  }

  // Can write if ticket is in their team
  if (ticket.assignedTeamId && teamIds.includes(ticket.assignedTeamId)) return true;

  // Check write access grants
  if (ticket.assignedTeamId) {
    const { data: grants } = await supabase
      .from("TicketAccess")
      .select("accessLevel")
      .eq("ticketId", ticketId)
      .in("teamId", teamIds)
      .eq("accessLevel", "WRITE");

    if (grants && grants.length > 0) return true;
  }

  return false;
}
