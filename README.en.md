# yuque-mcp-plus

Enhanced Yuque MCP server with stronger TOC and repository management support.

Main improvements over the baseline server:

- default repository resolution
- full repository TOC access
- document creation with `parentUuid`
- moving docs and TOC nodes
- TOC node creation and deletion
- official naming compatibility aliases
- generic OpenAPI passthrough via `yuque_request`
- generic multipart upload passthrough via `yuque_multipart_request`

Chinese documentation is the default: [README.md](/Users/program/code/code_mcp/yuque-mcp-plus/README.md).

## Status

Implemented and verified:

- `yuque_get_default_repository`
- `yuque_get_repository_toc_tree`
- `yuque_create_doc` with `parentUuid`
- `yuque_move_document`
- `yuque_create_toc_node`
- `yuque_delete_toc_node`
- automatic root node deletion
- compatibility aliases with the official Yuque MCP naming

Real integration checks have passed for:

- creating a root TOC node
- creating a document under a TOC node
- moving a TOC node
- deleting a TOC node
- deleting temporary test documents

## Environment Variables

Required:

- `YUQUE_TOKEN`

Optional:

- `YUQUE_API_BASE_URL`
- `YUQUE_TIMEOUT_MS`
- `YUQUE_RETRIES`
- `YUQUE_DEFAULT_REPO_ID`
- `YUQUE_DEFAULT_REPO_NAMESPACE`

Resolution order:

- `YUQUE_DEFAULT_REPO_ID`
- `YUQUE_DEFAULT_REPO_NAMESPACE`
- first accessible repository fallback

## Run

```bash
node ./src/index.js
```

Validation:

```bash
npm run check
```

Tests:

```bash
npm test
```

Release notes:

- [CHANGELOG.md](/Users/program/code/code_mcp/yuque-mcp-plus/CHANGELOG.md)

Release workflow:

- [RELEASE.md](/Users/program/code/code_mcp/yuque-mcp-plus/RELEASE.md)

## Codex MCP Config Example

```toml
[mcp_servers.yuque]
command = "node"
args = [ "/Users/program/code/code_mcp/yuque-mcp-plus/src/index.js" ]

[mcp_servers.yuque.env]
YUQUE_TOKEN = "your-token"
```

## Tool List

### Core Tools

| Tool | Purpose | Common Key Parameters |
| --- | --- | --- |
| `yuque_hello` | Verify service and token availability | none |
| `yuque_request` | Generic OpenAPI passthrough | `method`, `path`, `params`, `body` |
| `yuque_multipart_request` | Generic multipart upload request for attachment-style endpoints | `method`, `path`, `params`, `fields`, `files` |
| `yuque_get_user` | Get current user info | none |
| `yuque_get_repos` | List repositories | `ownerLogin`, `ownerType`, `userId` |
| `yuque_list_groups` | List groups for the current or specified user | `userId` |
| `yuque_get_repo` | Get repository details | `repoId`, `repoNamespace` |
| `yuque_get_default_repository` | Resolve the default repository | none |
| `yuque_search` | Search Yuque content | `query`, `type`, `repoId`, `page` |

### Repository and Document Tools

| Tool | Purpose | Common Key Parameters |
| --- | --- | --- |
| `yuque_get_docs` | List docs in a repository | `repoId`, `repoNamespace`, `limit`, `offset` |
| `yuque_get_doc` | Get a document | `docId`, `repoId`, `repoNamespace` |
| `yuque_create_doc` | Create a document, optionally under a TOC node | `repoId`, `title`, `body`, `format`, `parentUuid` |
| `yuque_update_doc` | Update a document title or body | `docId`, `title`, `body`, `format` |
| `yuque_delete_doc` | Delete a document | `docId`, `repoId`, `repoNamespace` |
| `yuque_create_repo` | Create a repository | `name`, `slug`, `description`, `ownerLogin`, `ownerType` |
| `yuque_update_repo` | Update repository settings | `repoId`, `repoNamespace`, `name`, `slug`, `description`, `isPublic` |
| `yuque_delete_repo` | Delete a repository | `repoId`, `repoNamespace` |

### TOC and Structure Tools

| Tool | Purpose | Common Key Parameters |
| --- | --- | --- |
| `yuque_get_repository_toc_tree` | Get the full TOC tree | `repoId`, `repoNamespace` |
| `yuque_create_toc_node` | Create a title or link node | `repoId`, `title`, `nodeType`, `parentUuid`, `actionMode`, `position` |
| `yuque_delete_toc_node` | Delete a TOC node, including root-node auto inference | `repoId`, `nodeUuid`, `parentUuid` |
| `yuque_move_document` | Move a doc or TOC node | `repoId`, `docId` or `nodeUuid`, `parentUuid`, `actionMode`, `position` |
| `yuque_update_repository_toc` | Send low-level TOC update payloads directly | `repoId`, `repoNamespace`, `payload` |

### Versions, Groups, and Stats

| Tool | Purpose | Common Key Parameters |
| --- | --- | --- |
| `yuque_list_doc_versions` | List document versions | `docId` |
| `yuque_get_doc_version` | Get a specific document version | `versionId` |
| `yuque_list_group_members` | List group members | `login` |
| `yuque_update_group_member` | Update a member role in a group | `login`, `userId`, `role` |
| `yuque_remove_group_member` | Remove a member from a group | `login`, `userId` |
| `yuque_group_stats` | Get overall group stats | `login` |
| `yuque_group_member_stats` | Get group member stats | `login` |
| `yuque_group_book_stats` | Get group repository stats | `login` |
| `yuque_group_doc_stats` | Get group document stats | `login` |

### Compatibility Aliases

| Alias | Actual Tool |
| --- | --- |
| `yuque_list_repos` | `yuque_get_repos` |
| `yuque_list_docs` | `yuque_get_docs` |
| `yuque_get_toc` | `yuque_get_repository_toc_tree` |
| `yuque_update_toc` | `yuque_update_repository_toc` |

## Common Examples

### Get default repository

```json
{}
```

Tool:

- `yuque_get_default_repository`

### Get repository TOC

```json
{
  "repoId": 63978478
}
```

Tool:

- `yuque_get_repository_toc_tree`

### Create a document under a specific TOC node

```json
{
  "repoId": 63978478,
  "title": "New Document",
  "body": "# Title\n\nContent",
  "format": "markdown",
  "parentUuid": "-W39TNJu_tufwcVm"
}
```

Tool:

- `yuque_create_doc`

### Create a TOC title node

```json
{
  "repoId": 63978478,
  "title": "New Section",
  "nodeType": "TITLE",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

If `parentUuid` is omitted, the node is created at the root level.

### Delete a TOC node

Simple usage:

```json
{
  "repoId": 63978478,
  "nodeUuid": "CxEXaBKTPFRKaopb"
}
```

Behavior:

- nested nodes: parent is inferred from `parent_uuid`
- root nodes: delete strategy is inferred automatically
- `parentUuid` can still be passed explicitly to override the inference

Tool:

- `yuque_delete_toc_node`

### Move a document or TOC node

```json
{
  "repoId": 63978478,
  "nodeUuid": "Mir36kbfs2f4g130",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

Or move by `docId`:

```json
{
  "repoId": 63978478,
  "docId": 259413650,
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

Tool:

- `yuque_move_document`

### Generic OpenAPI passthrough

```json
{
  "method": "GET",
  "path": "/user"
}
```

Or:

```json
{
  "method": "GET",
  "path": "/search",
  "params": {
    "q": "Yuque",
    "type": "doc"
  }
}
```

Tool:

- `yuque_request`

## Tool Quick Reference

This section is organized per tool so you can copy and edit payloads directly.

### `yuque_get_default_repository`

```json
{}
```

### `yuque_get_repos`

```json
{}
```

Filter by user or group owner:

```json
{
  "ownerLogin": "your-team",
  "ownerType": "groups"
}
```

### `yuque_get_repo`

```json
{
  "repoId": 63978478
}
```

### `yuque_get_repository_toc_tree`

```json
{
  "repoId": 63978478
}
```

### `yuque_create_toc_node`

Create a root-level title node:

```json
{
  "repoId": 63978478,
  "title": "Top Level Section",
  "nodeType": "TITLE"
}
```

Create a nested title node:

```json
{
  "repoId": 63978478,
  "title": "Nested Section",
  "nodeType": "TITLE",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

### `yuque_delete_toc_node`

Delete a TOC node with automatic strategy inference:

```json
{
  "repoId": 63978478,
  "nodeUuid": "CxEXaBKTPFRKaopb"
}
```

### `yuque_create_doc`

Create a root-level document:

```json
{
  "repoId": 63978478,
  "title": "Root Document",
  "body": "# Title\n\nContent",
  "format": "markdown"
}
```

Create a document under a TOC node:

```json
{
  "repoId": 63978478,
  "title": "Nested Document",
  "body": "# Title\n\nContent",
  "format": "markdown",
  "parentUuid": "-W39TNJu_tufwcVm"
}
```

### `yuque_update_doc`

```json
{
  "docId": 259413650,
  "title": "Updated Title",
  "body": "# New Title\n\nNew Content",
  "format": "markdown"
}
```

### `yuque_delete_doc`

```json
{
  "docId": 259413650
}
```

### `yuque_move_document`

Move by `docId`:

```json
{
  "repoId": 63978478,
  "docId": 259413650,
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

Move by `nodeUuid`:

```json
{
  "repoId": 63978478,
  "nodeUuid": "Mir36kbfs2f4g130",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

### `yuque_search`

```json
{
  "query": "Yuque",
  "type": "doc",
  "repoId": 63978478
}
```

### `yuque_list_doc_versions`

```json
{
  "docId": 259413650
}
```

### `yuque_get_doc_version`

```json
{
  "versionId": 123456789
}
```

### `yuque_list_group_members`

```json
{
  "login": "your-team"
}
```

### `yuque_update_group_member`

```json
{
  "login": "your-team",
  "userId": 123456,
  "role": 1
}
```

### `yuque_remove_group_member`

```json
{
  "login": "your-team",
  "userId": 123456
}
```

### `yuque_group_stats`

```json
{
  "login": "your-team"
}
```

### `yuque_request`

Get current user:

```json
{
  "method": "GET",
  "path": "/user"
}
```

Comment-style request example:

```json
{
  "method": "POST",
  "path": "/repos/63978478/docs/259413650/comments",
  "body": {
    "body": "This is a comment"
  }
}
```

### `yuque_multipart_request`

Attachment-style upload example:

```json
{
  "method": "POST",
  "path": "/repos/63978478/attachments",
  "fields": {
    "type": "file"
  },
  "files": [
    {
      "fieldName": "file",
      "filePath": "/absolute/path/to/example.png",
      "contentType": "image/png"
    }
  ]
}
```

Low-level TOC update:

```json
{
  "path": "/repos/63978478/toc",
  "method": "PUT",
  "body": {
    "action": "removeNode",
    "action_mode": "child",
    "target_uuid": "-W39TNJu_tufwcVm",
    "node_uuid": "Mir36kbfs2f4g130"
  }
}
```

## Compatibility Notes

The project provides official-style aliases:

- `yuque_list_repos` -> `yuque_get_repos`
- `yuque_list_docs` -> `yuque_get_docs`
- `yuque_get_toc` -> `yuque_get_repository_toc_tree`
- `yuque_update_toc` -> `yuque_update_repository_toc`

## Known Limits

- comments are not wrapped as dedicated tools yet; use `yuque_request`
- attachments are not wrapped as official dedicated tools, but upload-style endpoints can now be handled with `yuque_multipart_request`
- `yuque_update_repository_toc` is the low-level escape hatch for advanced TOC workflows

Notes:

- I checked the official `openapi-metadata` and `sdk` repositories
- they do not expose a clear dedicated OpenAPI surface for comments or attachments
- the current implementation therefore strengthens generic request support instead of hardcoding guessed endpoints

## Real Integration Notes

The following scenarios have already been verified against a real Yuque repository:

### Default repository resolution

- `yuque_get_default_repository` returns a usable repository
- the response includes `_defaultSource`
- this field helps explain how the default repository was chosen

### TOC retrieval

- `yuque_get_repository_toc_tree` returns `TITLE`, `DOC`, and hierarchy information correctly
- verified fields include `uuid`, `parent_uuid`, `prev_uuid`, and `sibling_uuid`

### Document creation under a TOC node

- `yuque_create_doc` with `parentUuid` creates the document first and then attaches it into the correct TOC location
- verified in the live TOC output

### Document and node movement

- `yuque_move_document` has been verified for:
- moving a document by `docId`
- moving a TOC node by `nodeUuid`
- moving items between root level and nested sections

### TOC node creation

- `yuque_create_toc_node` has been verified for root-level `TITLE` nodes
- nested title nodes have also been verified

### TOC node deletion

- `yuque_delete_toc_node` has been verified for:
- nested TOC nodes
- root-level TOC nodes
- root node deletion is now inferred automatically by the server

### Cleanup

- temporary test docs and TOC nodes were deleted successfully after each test
- the current implementation is suitable for regular repository structure maintenance

## Troubleshooting

### `Missing YUQUE_TOKEN`

Cause:

- `YUQUE_TOKEN` was not injected
- the process was started manually without the environment variable

Fix:

- check `[mcp_servers.yuque.env]` in your `config.toml`
- or launch manually with:

```bash
YUQUE_TOKEN="your-token" node ./src/index.js
```

### `doc not found`

Cause:

- the document ID does not exist
- the document was already deleted
- the repository reference is wrong

Fix:

- confirm the `docId` with `yuque_get_docs` or `yuque_get_doc`
- confirm the `repoId` or `repoNamespace`

### `action invalid`

Cause:

- the raw TOC payload sent to `yuque_update_repository_toc` uses an unsupported `action`

Fix:

- prefer higher-level tools:
- `yuque_create_toc_node`
- `yuque_delete_toc_node`
- `yuque_move_document`
- use `yuque_update_repository_toc` only for advanced cases

### `missing action_mode`

Cause:

- the TOC update payload is missing `action_mode`

Fix:

- avoid hand-writing low-level TOC payloads unless necessary
- for TOC deletion, prefer `yuque_delete_toc_node`

### `action_mode invalid`

Cause:

- the chosen `action_mode` does not match the TOC operation

Fix:

- nested node deletion usually uses `child`
- root node deletion usually needs sibling-based inference
- this logic is already handled in `yuque_delete_toc_node`

### `getaddrinfo ENOTFOUND www.yuque.com`

Cause:

- the runtime has no network access
- sandbox or proxy restrictions are blocking the request

Fix:

- run real integration checks in a network-enabled environment
- in Codex, rerun with elevation if the sandbox blocks networking

### Newly added tools are not visible in the current session

Cause:

- the MCP config was updated, but the current session did not hot-reload the tool surface

Fix:

- restart Codex
- re-enter the session and call the new tool again

## Project Layout

```text
src/
  config.js
  index.js
  server.js
  tools.js
  yuque-client.js

tests/
  tools.test.js
  yuque-client.test.js
```
