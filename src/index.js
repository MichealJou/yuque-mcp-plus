#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { startServer } from "./server.js";

async function main() {
  await startServer();
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error("Failed to start yuque-mcp-plus:", error);
    process.exit(1);
  });
}
