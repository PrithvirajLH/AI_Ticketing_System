import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  const supabase = getSupabase();

  // Get policies with targets
  const { data: policies, error: pErr } = await supabase
    .from("SlaPolicyConfig")
    .select(`
      id, name, description, isDefault, enabled, businessHoursOnly,
      escalationEnabled, escalationAfterPercent, createdAt
    `)
    .order("name");

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  // Get targets for all policies
  const { data: targets } = await supabase
    .from("SlaPolicyConfigTarget")
    .select("id, policyConfigId, priority, firstResponseHours, resolutionHours")
    .order("priority");

  // Get assignments
  const { data: assignments } = await supabase
    .from("SlaPolicyAssignment")
    .select(`
      id, policyConfigId,
      Team:teamId ( id, name )
    `);

  // Get business hours
  const { data: businessHours } = await supabase
    .from("SlaBusinessHoursSetting")
    .select("*")
    .single();

  // Combine
  const policiesWithTargets = (policies ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    targets: (targets ?? []).filter((t: Record<string, unknown>) => t.policyConfigId === p.id),
    assignments: (assignments ?? []).filter((a: Record<string, unknown>) => a.policyConfigId === p.id),
  }));

  return NextResponse.json({
    policies: policiesWithTargets,
    businessHours: businessHours ?? null,
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const now = new Date().toISOString();

  if (body.targetId && body.firstResponseHours !== undefined) {
    // Update SLA target
    const { error } = await supabase
      .from("SlaPolicyConfigTarget")
      .update({
        firstResponseHours: body.firstResponseHours,
        resolutionHours: body.resolutionHours,
        updatedAt: now,
      })
      .eq("id", body.targetId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: true });
  }

  if (body.policyId) {
    // Update policy config
    const { error } = await supabase
      .from("SlaPolicyConfig")
      .update({
        name: body.name,
        enabled: body.enabled,
        escalationEnabled: body.escalationEnabled,
        escalationAfterPercent: body.escalationAfterPercent,
        updatedAt: now,
      })
      .eq("id", body.policyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
