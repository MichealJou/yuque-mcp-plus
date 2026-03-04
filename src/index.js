#!/usr/bin/env node
import { startServer } from "./server.js";

async function main() {
  await startServer();
}

main().catch((error) => {
  console.error("Failed to start yuque-mcp-plus:", error);
  process.exit(1);
});
