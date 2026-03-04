import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { YuqueClient } from "../src/yuque-client.js";

function createClient() {
  return new YuqueClient({
    token: "test-token",
    apiBaseUrl: "https://example.com/api/v2",
    timeoutMs: 1000,
    retries: 1,
    defaultRepoId: "",
    defaultRepoNamespace: ""
  });
}

test("getRepos supports group owner lookup when ownerLogin is provided", async () => {
  const client = createClient();
  let requestedUrl = "";

  client.request = async (url) => {
    requestedUrl = url;
    return [];
  };

  await client.getRepos({ ownerType: "group", ownerLogin: "team-a" });
  assert.equal(requestedUrl, "/groups/team-a/repos");
});

test("rawRequest serializes query params", async () => {
  const client = createClient();
  let requested = {};

  client.request = async (url, options) => {
    requested = { url, options };
    return { ok: true };
  };

  await client.rawRequest({
    path: "/search",
    params: { q: "abc", page: 2 },
    method: "GET"
  });

  assert.equal(requested.url, "/search?q=abc&page=2");
  assert.equal(requested.options.method, "GET");
});

test("multipartRequest builds form data with fields and files", async () => {
  const client = createClient();
  const dir = await mkdtemp(join(tmpdir(), "yuque-mcp-plus-"));
  const filePath = join(dir, "sample.txt");
  let requested = {};

  await writeFile(filePath, "hello");

  client.request = async (url, options) => {
    requested = { url, options };
    return { ok: true };
  };

  await client.multipartRequest({
    path: "/upload",
    method: "POST",
    params: { repo_id: 42 },
    fields: { source: "test" },
    files: [
      {
        fieldName: "file",
        filePath,
        contentType: "text/plain"
      }
    ]
  });

  assert.equal(requested.url, "/upload?repo_id=42");
  assert.equal(requested.options.method, "POST");
  assert.ok(requested.options.data instanceof FormData);
});

test("resolveDeleteTocStrategy uses parent_uuid for nested nodes", async () => {
  const client = createClient();
  client.getRepositoryTocTree = async () => [
    { uuid: "child", parent_uuid: "parent", prev_uuid: "", sibling_uuid: "" }
  ];

  const strategy = await client.resolveDeleteTocStrategy({ repoId: 1, nodeUuid: "child" });
  assert.deepEqual(strategy, { actionMode: "child", targetUuid: "parent" });
});

test("resolveDeleteTocStrategy uses prev_uuid for root nodes", async () => {
  const client = createClient();
  client.getRepositoryTocTree = async () => [
    { uuid: "root", parent_uuid: "", prev_uuid: "prev-root", sibling_uuid: "" }
  ];

  const strategy = await client.resolveDeleteTocStrategy({ repoId: 1, nodeUuid: "root" });
  assert.deepEqual(strategy, { actionMode: "sibling", targetUuid: "prev-root" });
});
