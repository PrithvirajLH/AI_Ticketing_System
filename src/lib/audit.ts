import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

/**
 * Log an admin audit event.
 */
export async function logAuditEvent(input: {
  type: string;
  payload?: Record<string, unknown>;
  teamId?: string;
  teamName?: string;
  actorId?: string;
  actorEmail?: string;
  actorName?: string;
}) {
  const supabase = getSupabase();
  await supabase.from("AdminAuditEvent").insert({
    id: randomUUID(),
    type: input.type,
    payload: input.payload ?? null,
    teamId: input.teamId ?? null,
    teamName: input.teamName ?? null,
    createdById: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    actorName: input.actorName ?? null,
  });
}
