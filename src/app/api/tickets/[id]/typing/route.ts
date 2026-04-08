import { NextResponse } from "next/server";

// In-memory typing state (replace with Redis in production)
const typingState = new Map<string, Map<string, number>>(); // ticketId → { userId → timestamp }
const TIMEOUT = 4000;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const now = Date.now();
  const users = typingState.get(id);

  if (!users) return NextResponse.json({ typingUsers: [] });

  // Clean expired
  const active: string[] = [];
  for (const [userId, timestamp] of users) {
    if (now - timestamp < TIMEOUT) {
      active.push(userId);
    } else {
      users.delete(userId);
    }
  }

  return NextResponse.json({ typingUsers: active });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const userId = body.userId as string;

  if (!typingState.has(id)) {
    typingState.set(id, new Map());
  }

  typingState.get(id)!.set(userId, Date.now());

  return NextResponse.json({ ok: true });
}
