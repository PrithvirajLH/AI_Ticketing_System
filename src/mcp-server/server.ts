/**
 * MCP Server for AI Ticket Master
 *
 * Exposes all pipeline tools via the Model Context Protocol so that
 * Azure AI Foundry agents can call them directly.
 *
 * Tool Categories (per SRS Layer 2):
 * - User Tools: get_user_profile, get_user_history
 * - Routing Tools: get_departments, get_categories, get_routing_rules
 * - Ticket Tools: create_ticket, create_sla_instance
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getUserProfile, getUserHistory } from "../lib/ai/tools/user-tools";
import {
  getDepartments,
  getCategories,
  getRoutingRules,
} from "../lib/ai/tools/classification-tools";
import {
  createTicket,
  createSlaInstance,
} from "../lib/ai/tools/ticket-tools";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "ai-ticket-master",
    version: "1.0.0",
  });

  // ─── User Tools ──────────────────────────────────────────────────────────

  server.tool(
    "get_user_profile",
    "Retrieves the profile of a user including their department, role, location, and primary team. Use this to add context about who is making a request.",
    {
      userId: z.string().describe("The ID of the user to look up"),
    },
    async ({ userId }) => {
      const result = await getUserProfile(userId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_user_history",
    "Retrieves the 10 most recent tickets submitted by a user. Use this to identify recurring issues or patterns that help with classification.",
    {
      userId: z.string().describe("The ID of the user to look up"),
    },
    async ({ userId }) => {
      const result = await getUserHistory(userId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // ─── Routing Tools ───────────────────────────────────────────────────────

  server.tool(
    "get_departments",
    "Retrieves all active departments (teams) from the database with their descriptions, assignment strategies, and member counts.",
    {},
    async () => {
      const result = await getDepartments();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_categories",
    "Retrieves the full category tree (hierarchical) with parent-child relationships. Categories are used to classify tickets within a department.",
    {},
    async () => {
      const result = await getCategories();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_routing_rules",
    "Retrieves active keyword-based routing rules that map keywords to specific teams. These rules help determine which department should handle a request.",
    {},
    async () => {
      const result = await getRoutingRules();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  // ─── Ticket Tools ────────────────────────────────────────────────────────

  server.tool(
    "create_ticket",
    "Creates a new ticket in the database with the specified fields. Returns the created ticket with its auto-generated ID and number. Also logs a TICKET_CREATED event.",
    {
      subject: z
        .string()
        .max(255)
        .describe("Ticket subject line (max 255 chars)"),
      description: z
        .string()
        .describe("Structured ticket description for the agent"),
      priority: z
        .enum(["P1", "P2", "P3", "P4"])
        .describe("Ticket priority level"),
      channel: z
        .enum(["PORTAL", "EMAIL"])
        .describe("Channel the request came through"),
      assignedTeamId: z
        .string()
        .describe("ID of the team to assign the ticket to"),
      categoryId: z
        .string()
        .nullable()
        .describe("ID of the category, or null if uncategorized"),
      displayId: z
        .string()
        .describe("Human-readable ticket ID (e.g., IT-0007)"),
      tags: z
        .array(z.string())
        .describe("Tags extracted from the request"),
      requesterId: z
        .string()
        .describe("ID of the user who submitted the request"),
    },
    async (params) => {
      const result = await createTicket({
        draft: {
          subject: params.subject,
          description: params.description,
          priority: params.priority,
          channel: params.channel,
          assignedTeamId: params.assignedTeamId,
          categoryId: params.categoryId,
          displayId: params.displayId,
          tags: params.tags,
        },
        requesterId: params.requesterId,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "create_sla_instance",
    "Creates an SLA tracking instance for a ticket based on the default SLA policy and the ticket's priority. Sets first response and resolution due dates automatically.",
    {
      ticketId: z
        .string()
        .describe("ID of the ticket to create SLA tracking for"),
      priority: z
        .enum(["P1", "P2", "P3", "P4"])
        .describe("Priority level to determine SLA targets"),
    },
    async ({ ticketId, priority }) => {
      const result = await createSlaInstance(ticketId, priority);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  return server;
}
