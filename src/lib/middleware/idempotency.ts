import { randomUUID, createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db/supabase";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Idempotency wrapper for mutating API handlers.
 *
 * Usage:
 *   return withIdempotency(request, "POST", "/api/tickets/123/transition", "user-id", async () => {
 *     // your handler logic
 *     return NextResponse.json({ ... });
 *   });
 *
 * If the client sends an `Idempotency-Key` header, duplicate requests
 * return the cached response instead of re-executing.
 */
export async function withIdempotency(
  request: Request,
  method: string,
  route: string,
  actorId: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const key = request.headers.get("idempotency-key");

  // No idempotency key — run normally
  if (!key) return handler();

  const supabase = getSupabase();
  const bodyText = await request.clone().text();
  const requestHash = createHash("sha256").update(bodyText).digest("hex");

  // Check for existing request
  const { data: existing } = await supabase
    .from("IdempotencyRequest")
    .select("state, statusCode, responseBody, requestHash")
    .eq("key", key)
    .eq("method", method)
    .eq("route", route)
    .eq("actorId", actorId)
    .single();

  if (existing) {
    // Same key but different body — conflict
    if (existing.requestHash !== requestHash) {
      return NextResponse.json(
        { error: "Idempotency key already used with different request body" },
        { status: 409 }
      );
    }

    // Already completed — replay
    if (existing.state === "COMPLETED" && existing.statusCode && existing.responseBody) {
      const response = NextResponse.json(existing.responseBody, { status: existing.statusCode });
      response.headers.set("Idempotency-Replayed", "true");
      return response;
    }

    // Still in progress — conflict
    if (existing.state === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Request is still being processed" },
        { status: 409 }
      );
    }
  }

  // Reserve the idempotency key
  const reservationId = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS).toISOString();

  await supabase.from("IdempotencyRequest").insert({
    id: reservationId,
    key,
    method,
    route,
    actorId,
    requestHash,
    state: "IN_PROGRESS",
    expiresAt,
    updatedAt: now.toISOString(),
  });

  try {
    // Execute the handler
    const response = await handler();

    // Cache the response
    const responseBody = await response.clone().json().catch(() => null);
    await supabase
      .from("IdempotencyRequest")
      .update({
        state: "COMPLETED",
        statusCode: response.status,
        responseBody,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", reservationId);

    return response;
  } catch (error) {
    // Release on error
    await supabase
      .from("IdempotencyRequest")
      .delete()
      .eq("id", reservationId);

    throw error;
  }
}
