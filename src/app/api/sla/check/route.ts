import { NextResponse } from "next/server";
import { checkSlaBreaches } from "@/lib/sla/breach-checker";

/**
 * POST /api/sla/check
 *
 * Runs the SLA breach detection worker.
 * Call this on a schedule (e.g., every 5 minutes via cron)
 * or manually to check for at-risk and breached tickets.
 */
export async function POST() {
  try {
    const result = await checkSlaBreaches();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
