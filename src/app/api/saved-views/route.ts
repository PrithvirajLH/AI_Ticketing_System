import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { CreateSavedViewSchema, validateBody } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const supabase = getSupabase();

  let query = supabase
    .from("SavedView")
    .select("id, name, filters, userId, teamId, isDefault, createdAt")
    .order("name");

  if (userId) {
    query = query.or(`userId.eq.${userId},userId.is.null`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ views: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const validation = validateBody(CreateSavedViewSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, filters, userId, teamId, isDefault } = validation.data;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("SavedView")
    .insert({
      id: randomUUID(),
      name,
      filters,
      userId: userId ?? null,
      teamId: teamId ?? null,
      isDefault,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ view: data }, { status: 201 });
}
