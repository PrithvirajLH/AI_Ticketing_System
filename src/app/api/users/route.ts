import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";
import { UpdateUserRoleSchema, validateBody } from "@/lib/validation/schemas";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("User")
    .select("id, displayName, email, role, department, location, primaryTeamId, createdAt")
    .order("displayName");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const validation = validateBody(UpdateUserRoleSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { userId, role, department } = validation.data;
  const supabase = getSupabase();

  const { error } = await supabase
    .from("User")
    .update({
      role,
      department,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: true });
}
