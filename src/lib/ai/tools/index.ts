import { getUserProfile, getUserHistory } from "./user-tools";
import {
  getDepartments,
  getCategories,
  getRoutingRules,
} from "./classification-tools";
import { createTicket, createSlaInstance } from "./ticket-tools";
import type { ToolResult, TicketDraft } from "../types";

// ─── Tool Handler Type ───────────────────────────────────────────────────────

type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult<unknown>>;

// ─── Tool Registry ───────────────────────────────────────────────────────────

const toolHandlers: Record<string, ToolHandler> = {
  get_user_profile: async (args) => {
    return getUserProfile(args.userId as string);
  },

  get_user_history: async (args) => {
    return getUserHistory(args.userId as string);
  },

  get_departments: async () => {
    return getDepartments();
  },

  get_categories: async () => {
    return getCategories();
  },

  get_routing_rules: async () => {
    return getRoutingRules();
  },

  create_ticket: async (args) => {
    return createTicket({
      draft: args.draft as TicketDraft,
      requesterId: args.requesterId as string,
    });
  },

  create_sla_instance: async (args) => {
    return createSlaInstance(
      args.ticketId as string,
      args.priority as "P1" | "P2" | "P3" | "P4"
    );
  },
};

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const handler = toolHandlers[toolName];

  if (!handler) {
    return JSON.stringify({
      success: false,
      error: `Unknown tool: ${toolName}`,
    });
  }

  try {
    const result = await handler(args);
    return JSON.stringify(result);
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: `Tool execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

export function getAvailableTools(): string[] {
  return Object.keys(toolHandlers);
}
