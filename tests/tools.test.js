import test from "node:test";
import assert from "node:assert/strict";

import { TOOLS, handleTool, resolveToolName } from "../src/tools.js";

function makeClient() {
  return {
    getRepos: async (arg) => ({ method: "getRepos", arg }),
    getDocs: async (refs, options) => ({ method: "getDocs", refs, options }),
    getRepositoryTocTree: async (arg) => ({ method: "getRepositoryTocTree", arg }),
    updateToc: async (arg) => ({ method: "updateToc", arg }),
    deleteTocNode: async (arg) => ({ method: "deleteTocNode", arg }),
    getUser: async () => ({ id: 1 }),
    hello: async () => ({ ok: true }),
    rawRequest: async (arg) => ({ method: "rawRequest", arg }),
    multipartRequest: async (arg) => ({ method: "multipartRequest", arg })
  };
}

test("compatibility alias names are published", () => {
  const names = new Set(TOOLS.map((tool) => tool.name));

  assert.ok(names.has("yuque_list_repos"));
  assert.ok(names.has("yuque_list_docs"));
  assert.ok(names.has("yuque_get_toc"));
  assert.ok(names.has("yuque_update_toc"));
  assert.ok(names.has("yuque_multipart_request"));
});

test("resolveToolName maps official aliases to canonical handlers", () => {
  assert.equal(resolveToolName("yuque_list_repos"), "yuque_get_repos");
  assert.equal(resolveToolName("yuque_list_docs"), "yuque_get_docs");
  assert.equal(resolveToolName("yuque_get_toc"), "yuque_get_repository_toc_tree");
  assert.equal(resolveToolName("yuque_update_toc"), "yuque_update_repository_toc");
  assert.equal(resolveToolName("yuque_get_user"), "yuque_get_user");
});

test("yuque_list_repos alias executes the repository handler", async () => {
  const result = await handleTool("yuque_list_repos", { ownerType: "group", ownerLogin: "acme" }, makeClient());
  const payload = JSON.parse(result.content[0].text);

  assert.equal(payload.method, "getRepos");
  assert.equal(payload.arg.ownerType, "group");
  assert.equal(payload.arg.ownerLogin, "acme");
});

test("yuque_list_docs alias executes the docs handler", async () => {
  const result = await handleTool("yuque_list_docs", { repoId: 42, limit: 10 }, makeClient());
  const payload = JSON.parse(result.content[0].text);

  assert.equal(payload.method, "getDocs");
  assert.equal(payload.refs.repoId, 42);
  assert.equal(payload.options.limit, 10);
});

test("yuque_delete_toc_node executes the TOC delete handler", async () => {
  const result = await handleTool(
    "yuque_delete_toc_node",
    { repoId: 42, nodeUuid: "node-1", parentUuid: "parent-1" },
    makeClient()
  );
  const payload = JSON.parse(result.content[0].text);

  assert.equal(payload.method, "deleteTocNode");
  assert.equal(payload.arg.nodeUuid, "node-1");
  assert.equal(payload.arg.parentUuid, "parent-1");
});

test("yuque_multipart_request executes the multipart handler", async () => {
  const result = await handleTool(
    "yuque_multipart_request",
    {
      path: "/upload",
      files: [{ fieldName: "file", filePath: "/tmp/example.txt" }]
    },
    makeClient()
  );
  const payload = JSON.parse(result.content[0].text);

  assert.equal(payload.method, "multipartRequest");
  assert.equal(payload.arg.path, "/upload");
  assert.equal(payload.arg.files[0].fieldName, "file");
});

test("unknown tools still fail loudly", async () => {
  await assert.rejects(
    () => handleTool("yuque_missing", {}, makeClient()),
    /Unknown tool: yuque_missing/
  );
});
