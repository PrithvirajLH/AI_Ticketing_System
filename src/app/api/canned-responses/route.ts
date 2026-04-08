import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { CreateCannedResponseSchema, validateBody } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const supabase = getSupabase();

  let query = supabase
    .from("CannedResponse")
    .select("id, name, content, userId, teamId, createdAt")
    .order("name");

  if (teamId) {
    query = query.or(`teamId.eq.${teamId},teamId.is.null`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ responses: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateBody(CreateCannedResponseSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, content, userId, teamId } = validation.data;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("CannedResponse")
    .insert({
      id: randomUUID(),
      name,
      content,
      userId: userId ?? null,
      teamId: teamId ?? null,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ response: data }, { status: 201 });
}
