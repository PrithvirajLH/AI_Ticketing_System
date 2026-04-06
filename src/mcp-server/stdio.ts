/**
 * MCP Server — Stdio Transport
 *
 * Runs the MCP server over stdio for local testing with MCP clients.
 *
 * Start: npx tsx src/mcp-server/stdio.ts
 */

import "dotenv/config";
import { createMcpServer } from "./server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
