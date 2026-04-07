import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("Category")
    .select("id, name, slug, description, isActive, parentId, createdAt")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("Category")
    .insert({
      id: randomUUID(),
      name: body.name,
      slug: body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-"),
      description: body.description ?? null,
      parentId: body.parentId ?? null,
      isActive: true,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}
