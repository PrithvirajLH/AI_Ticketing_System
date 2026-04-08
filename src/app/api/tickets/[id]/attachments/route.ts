import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/db/supabase";

// GET — list attachments for a ticket
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("Attachment")
    .select(`
      id, fileName, contentType, sizeBytes, scanStatus, createdAt,
      uploadedBy:uploadedById ( displayName )
    `)
    .eq("ticketId", id)
    .order("createdAt", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attachments: data ?? [] });
}

// POST — upload attachment (stores metadata, file goes to Supabase Storage)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const uploadedById = formData.get("uploadedById") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const supabase = getSupabase();
    const attachmentId = randomUUID();
    const storageKey = `tickets/${id}/${attachmentId}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storageKey, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Storage bucket might not exist — store metadata anyway
      console.error("Storage upload failed:", uploadError.message);
    }

    // Save metadata
    const { data, error } = await supabase
      .from("Attachment")
      .insert({
        id: attachmentId,
        ticketId: id,
        uploadedById,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        storageKey,
        scanStatus: "PENDING",
      })
      .select("id, fileName, sizeBytes, contentType, scanStatus, createdAt")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log event
    await supabase.from("TicketEvent").insert({
      id: randomUUID(),
      ticketId: id,
      type: "ATTACHMENT_ADDED",
      payload: { fileName: file.name, sizeBytes: file.size },
      createdById: uploadedById,
    });

    return NextResponse.json({ attachment: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
