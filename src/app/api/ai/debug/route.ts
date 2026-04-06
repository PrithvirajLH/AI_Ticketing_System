import { NextResponse } from "next/server";
import { PipelineInputSchema } from "@/lib/ai/types";
import { classifyTicketDebug } from "@/lib/ai/pipeline-debug";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parseResult = PipelineInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const result = await classifyTicketDebug(parseResult.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
