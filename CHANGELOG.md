# Changelog

## 0.3.0 - 2026-03-04

Changed:

- release as the final recommended version

## 0.2.4 - 2026-03-04

Fixed:

- kept the stdio MCP process alive after startup so client initialization can complete

## 0.2.3 - 2026-03-04

Fixed:

- fixed the published CLI entry so `npx yuque-mcp-plus` starts the MCP server correctly

## 0.2.2 - 2026-03-04

Changed:

- added switchable `node` and `npx` setup examples for Codex, Claude Code, Qoder, OpenCode, and Trae

## 0.2.1 - 2026-03-04

Changed:

- simplified the Chinese README title copy to "语雀 MCP 服务"
- added `npx yuque-mcp-plus` usage to Chinese and English docs
- updated package metadata description for npm usage

## 0.2.0 - 2026-03-04

Added:

- default repository resolution with fallback tracing via `_defaultSource`
- repository TOC tree retrieval
- document creation with `parentUuid`
- document and TOC node movement
- TOC node creation and dedicated deletion support
- automatic root TOC node deletion strategy
- official naming compatibility aliases
- generic OpenAPI passthrough via `yuque_request`
- group, member, version, and stats tools
- Chinese and English usage documentation
- real integration notes and troubleshooting guides
- `yuque_multipart_request` for upload-style attachment workflows where official endpoints are known

Verified:

- `npm run check`
- `npm test`
- live Yuque integration for TOC creation, movement, deletion, and doc attachment

## 0.1.0 - 2026-03-04

Initial local `yuque-mcp-plus` scaffold:

- Node.js MCP server entrypoint
- Yuque API client wrapper
- base tool registration and command routing
