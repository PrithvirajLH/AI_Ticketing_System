import { NextResponse } from "next/server";
import { runPhase2 } from "@/lib/ai/pipeline-debug";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await runPhase2(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
