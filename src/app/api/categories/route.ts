import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";
import { CreateCategorySchema, validateBody } from "@/lib/validation/schemas";

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
  const validation = validateBody(CreateCategorySchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { name, slug, description, parentId } = validation.data;
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("Category")
    .insert({
      id: randomUUID(),
      name,
      slug: slug ?? name.toLowerCase().replace(/\s+/g, "-"),
      description: description ?? null,
      parentId: parentId ?? null,
      isActive: true,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  const { logAuditEvent } = await import("@/lib/audit");
  await logAuditEvent({ type: "CATEGORY_CREATED", payload: { name, slug: data.slug } }).catch(() => {});

  return NextResponse.json({ category: data }, { status: 201 });
}
