/**
 * MCP Server — SSE Transport
 *
 * Runs the MCP server over Server-Sent Events (HTTP).
 * This is what Azure AI Foundry connects to.
 *
 * Start: npx tsx src/mcp-server/sse.ts
 * Default: http://localhost:3001/sse
 */

import "dotenv/config";
import { createMcpServer } from "./server";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "node:http";

const PORT = parseInt(process.env.MCP_PORT ?? "3001", 10);

const server = createMcpServer();
const transports = new Map<string, SSEServerTransport>();

const httpServer = http.createServer(async (req, res) => {
  // CORS headers for Foundry
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/sse" && req.method === "GET") {
    // SSE connection endpoint
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);

    res.on("close", () => {
      transports.delete(transport.sessionId);
    });

    await server.connect(transport);
    return;
  }

  if (url.pathname === "/messages" && req.method === "POST") {
    // Message endpoint for client responses
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId || !transports.has(sessionId)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handlePostMessage(req, res);
    return;
  }

  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        server: "ai-ticket-master-mcp",
        tools: 7,
        activeSessions: transports.size,
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, () => {
  console.log(`MCP Server (SSE) running on http://localhost:${PORT}`);
  console.log(`  SSE endpoint:    http://localhost:${PORT}/sse`);
  console.log(`  Health check:    http://localhost:${PORT}/health`);
  console.log(`  Tools exposed:   7`);
  console.log("");
  console.log("Tools:");
  console.log("  - get_user_profile");
  console.log("  - get_user_history");
  console.log("  - get_departments");
  console.log("  - get_categories");
  console.log("  - get_routing_rules");
  console.log("  - create_ticket");
  console.log("  - create_sla_instance");
});
