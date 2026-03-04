import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from "@modelcontextprotocol/sdk/types.js";
import { getConfig, validateConfig } from "./config.js";
import { TOOLS, handleTool } from "./tools.js";
import { YuqueClient } from "./yuque-client.js";

export function createServer() {
  const config = getConfig();
  const validation = validateConfig(config);

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const server = new Server(
    {
      name: "yuque-mcp-plus",
      version: "0.2.2"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const client = new YuqueClient(config);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      return await handleTool(request.params.name, request.params.arguments || {}, client);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new McpError(ErrorCode.InternalError, message);
    }
  });

  return server;
}

export async function startServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
