import { getSupabase } from "@/lib/db/supabase";
import type { ToolResult } from "../types";

interface LogCorrectionInput {
  originalText: string;
  suggestedTeamId: string;
  suggestedTeamName: string;
  selectedTeamId: string;
  selectedTeamName: string;
  suggestedConfidence: number;
  intentData: unknown;
  userId?: string;
}

export async function logRoutingCorrection(
  input: LogCorrectionInput
): Promise<ToolResult<{ id: string }>> {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("RoutingCorrection")
      .insert({
        originalText: input.originalText,
        suggestedTeamId: input.suggestedTeamId,
        suggestedTeamName: input.suggestedTeamName,
        selectedTeamId: input.selectedTeamId,
        selectedTeamName: input.selectedTeamName,
        suggestedConfidence: input.suggestedConfidence,
        intentData: input.intentData,
        userId: input.userId,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: `Failed to log correction: ${error?.message}` };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: `Failed to log correction: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
