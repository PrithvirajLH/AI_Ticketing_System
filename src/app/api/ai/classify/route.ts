import { NextResponse } from "next/server";
import { PipelineInputSchema } from "@/lib/ai/types";
import { classifyTicket } from "@/lib/ai/pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = PipelineInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          status: "error",
          error: "Invalid request body",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Run the pipeline
    const result = await classifyTicket(parseResult.data);

    // Determine HTTP status based on pipeline result
    const httpStatus =
      result.status === "error"
        ? 500
        : result.status === "needs_clarification"
          ? 200
          : 201;

    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    const message =
      process.env.NODE_ENV === "development"
        ? `Pipeline error: ${error instanceof Error ? error.message : "Unknown error"}`
        : "Internal server error";

    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    );
  }
}
