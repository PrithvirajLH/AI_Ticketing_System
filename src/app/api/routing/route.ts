import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { CreateRoutingRuleSchema, validateBody } from "@/lib/validation/schemas";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("RoutingRule")
    .select(`
      id, name, keywords, priority, isActive, assigneeId, createdAt,
      Team:teamId ( id, name )
    `)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rules = (data ?? []).map((r: Record<string, unknown>) => {
    const team = r.Team as { id: string; name: string } | null;
    return { ...r, teamId: team?.id, teamName: team?.name, Team: undefined };
  });

  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateBody(CreateRoutingRuleSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, keywords, teamId, priority, assigneeId } = validation.data;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("RoutingRule")
    .insert({
      id: randomUUID(),
      name,
      keywords,
      teamId,
      priority,
      isActive: true,
      assigneeId: assigneeId ?? null,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { logAuditEvent } = await import("@/lib/audit");
  await logAuditEvent({ type: "ROUTING_RULE_CREATED", payload: { name, keywords, teamId } }).catch(() => {});

  return NextResponse.json({ rule: data }, { status: 201 });
}
