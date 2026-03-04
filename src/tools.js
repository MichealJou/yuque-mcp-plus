function schemaProperty(type, description, extras = {}) {
  return {
    type,
    description,
    ...extras
  };
}

function jsonText(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function repoRefSchema() {
  return {
    repoId: schemaProperty("number", "Yuque repository ID."),
    repoNamespace: schemaProperty("string", "Yuque repository namespace.")
  };
}

function registerAlias(aliases, aliasName, targetName) {
  aliases[aliasName] = targetName;
}

const TOOL_DEFINITIONS = [
  {
    name: "yuque_request",
    description: "Generic Yuque OpenAPI request passthrough for endpoints not wrapped by dedicated tools.",
    inputSchema: {
      type: "object",
      properties: {
        method: schemaProperty("string", "HTTP method.", { enum: ["GET", "POST", "PUT", "DELETE", "PATCH"] }),
        path: schemaProperty("string", "API path starting with /, for example /repos/123."),
        params: {
          type: "object",
          description: "Optional query parameters."
        },
        body: {
          type: "object",
          description: "Optional JSON request body."
        }
      },
      required: ["path"]
    }
  },
  {
    name: "yuque_multipart_request",
    description: "Generic Yuque multipart request for upload-style endpoints such as attachment workflows.",
    inputSchema: {
      type: "object",
      properties: {
        method: schemaProperty("string", "HTTP method.", { enum: ["POST", "PUT", "PATCH"] }),
        path: schemaProperty("string", "API path starting with /, for example /repos/123/resources."),
        params: {
          type: "object",
          description: "Optional query parameters."
        },
        fields: {
          type: "object",
          description: "Optional multipart text fields."
        },
        files: {
          type: "array",
          description: "Files to upload as multipart form-data.",
          items: {
            type: "object",
            properties: {
              fieldName: schemaProperty("string", "Multipart field name."),
              filePath: schemaProperty("string", "Absolute or workspace-local file path."),
              filename: schemaProperty("string", "Optional override filename."),
              contentType: schemaProperty("string", "Optional MIME type.")
            },
            required: ["fieldName", "filePath"]
          }
        }
      },
      required: ["path", "files"]
    }
  },
  {
    name: "yuque_hello",
    description: "Call the Yuque hello endpoint.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "yuque_get_user",
    description: "Get the current Yuque user.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "yuque_get_repos",
    description: "List Yuque repositories for the current user or a specified user.",
    inputSchema: {
      type: "object",
      properties: {
        userId: schemaProperty("string", "Optional Yuque user ID."),
        ownerType: schemaProperty("string", "Optional owner type.", { enum: ["user", "group"] }),
        ownerLogin: schemaProperty("string", "Optional owner login. When provided, ownerType decides /users/{login}/repos or /groups/{login}/repos.")
      }
    }
  },
  {
    name: "yuque_list_groups",
    description: "List groups or teams for the current user or a specified user.",
    inputSchema: {
      type: "object",
      properties: {
        userId: schemaProperty("number", "Optional Yuque user ID.")
      }
    }
  },
  {
    name: "yuque_get_repo",
    description: "Get repository detail.",
    inputSchema: {
      type: "object",
      properties: repoRefSchema()
    }
  },
  {
    name: "yuque_get_default_repository",
    description: "Resolve the default Yuque repository using server config or a fallback heuristic.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "yuque_get_repository_toc_tree",
    description: "Get the full repository TOC tree, including nested directories and docs.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        repoNamespace: schemaProperty("string", "Yuque repository namespace, for example user/repo.")
      }
    }
  },
  {
    name: "yuque_get_docs",
    description: "List docs in a repository.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        limit: schemaProperty("number", "Optional page size.", { minimum: 1, maximum: 100 }),
        offset: schemaProperty("number", "Optional offset.", { minimum: 0 })
      }
    }
  },
  {
    name: "yuque_get_doc",
    description: "Get doc detail by doc ID.",
    inputSchema: {
      type: "object",
      properties: {
        docId: schemaProperty("number", "Yuque doc ID."),
        ...repoRefSchema()
      },
      required: ["docId"]
    }
  },
  {
    name: "yuque_create_doc",
    description: "Create a doc. If parentUuid is provided, the doc is attached under that TOC node.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        title: schemaProperty("string", "Doc title.", { minLength: 1 }),
        body: schemaProperty("string", "Markdown or lake body."),
        format: schemaProperty("string", "Doc format.", { enum: ["markdown", "lake", "html"] }),
        slug: schemaProperty("string", "Optional slug."),
        parentUuid: schemaProperty("string", "Optional TOC parent UUID.")
      },
      required: ["title"]
    }
  },
  {
    name: "yuque_update_doc",
    description: "Update an existing doc.",
    inputSchema: {
      type: "object",
      properties: {
        docId: schemaProperty("number", "Yuque doc ID."),
        ...repoRefSchema(),
        title: schemaProperty("string", "Optional new title."),
        body: schemaProperty("string", "Optional new body."),
        format: schemaProperty("string", "Optional new format.", { enum: ["markdown", "lake", "html"] })
      },
      required: ["docId"]
    }
  },
  {
    name: "yuque_move_document",
    description: "Move a doc or TOC node to another parent by UUID.",
    inputSchema: {
      type: "object",
      properties: {
        docId: schemaProperty("number", "Doc ID. Used to resolve nodeUuid if nodeUuid is omitted."),
        nodeUuid: schemaProperty("string", "Existing TOC node UUID."),
        ...repoRefSchema(),
        parentUuid: schemaProperty("string", "Target parent UUID."),
        targetUuid: schemaProperty("string", "Alias of parentUuid."),
        actionMode: schemaProperty("string", "TOC action mode.", { enum: ["child", "sibling"] }),
        position: schemaProperty("string", "Insert position.", { enum: ["append", "prepend"] })
      }
    }
  },
  {
    name: "yuque_create_toc_node",
    description: "Create a TITLE or LINK node in the repository TOC tree.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        title: schemaProperty("string", "Node title.", { minLength: 1 }),
        nodeType: schemaProperty("string", "Node type.", { enum: ["TITLE", "LINK"] }),
        url: schemaProperty("string", "Optional URL when nodeType is LINK."),
        parentUuid: schemaProperty("string", "Target parent UUID."),
        targetUuid: schemaProperty("string", "Alias of parentUuid."),
        actionMode: schemaProperty("string", "TOC action mode.", { enum: ["child", "sibling"] }),
        position: schemaProperty("string", "Insert position.", { enum: ["append", "prepend"] })
      },
      required: ["title"]
    }
  },
  {
    name: "yuque_delete_toc_node",
    description: "Delete a TITLE or LINK node from the repository TOC tree.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        nodeUuid: schemaProperty("string", "Existing TOC node UUID."),
        parentUuid: schemaProperty("string", "Optional parent TOC UUID. If omitted, the server resolves the delete strategy from the TOC tree."),
        targetUuid: schemaProperty("string", "Alias of parentUuid."),
        actionMode: schemaProperty("string", "Optional TOC action mode override.", { enum: ["child", "sibling"] })
      },
      required: ["nodeUuid"]
    }
  },
  {
    name: "yuque_delete_doc",
    description: "Delete a doc by ID.",
    inputSchema: {
      type: "object",
      properties: {
        docId: schemaProperty("number", "Yuque doc ID."),
        ...repoRefSchema()
      },
      required: ["docId"]
    }
  },
  {
    name: "yuque_search",
    description: "Search Yuque content.",
    inputSchema: {
      type: "object",
      properties: {
        query: schemaProperty("string", "Search query.", { minLength: 1 }),
        type: schemaProperty("string", "Search type.", { enum: ["DOC", "BOOK", "USER"] }),
        page: schemaProperty("number", "Page number.", { minimum: 1 }),
        repoId: schemaProperty("number", "Optional repository ID filter.")
      },
      required: ["query"]
    }
  },
  {
    name: "yuque_create_repo",
    description: "Create a repository.",
    inputSchema: {
      type: "object",
      properties: {
        name: schemaProperty("string", "Repository name.", { minLength: 1 }),
        slug: schemaProperty("string", "Optional repository slug."),
        description: schemaProperty("string", "Optional repository description."),
        isPublic: schemaProperty("boolean", "Whether the repository is public."),
        ownerType: schemaProperty("string", "Owner type.", { enum: ["user", "group"] }),
        ownerLogin: schemaProperty("string", "Owner login for user or group repo creation.")
      },
      required: ["name"]
    }
  },
  {
    name: "yuque_update_repo",
    description: "Update repository metadata.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        name: schemaProperty("string", "Repository name."),
        slug: schemaProperty("string", "Repository slug."),
        description: schemaProperty("string", "Repository description."),
        isPublic: schemaProperty("boolean", "Whether the repository is public.")
      }
    }
  },
  {
    name: "yuque_delete_repo",
    description: "Delete a repository.",
    inputSchema: {
      type: "object",
      properties: repoRefSchema()
    }
  },
  {
    name: "yuque_update_repository_toc",
    description: "Send a raw TOC update payload to the repository TOC API.",
    inputSchema: {
      type: "object",
      properties: {
        ...repoRefSchema(),
        payload: {
          type: "object",
          description: "Raw TOC update payload."
        }
      },
      required: ["payload"]
    }
  },
  {
    name: "yuque_list_doc_versions",
    description: "List all versions of a document.",
    inputSchema: {
      type: "object",
      properties: {
        docId: schemaProperty("number", "Yuque doc ID.")
      },
      required: ["docId"]
    }
  },
  {
    name: "yuque_get_doc_version",
    description: "Get a specific document version.",
    inputSchema: {
      type: "object",
      properties: {
        versionId: schemaProperty("number", "Yuque version ID.")
      },
      required: ["versionId"]
    }
  },
  {
    name: "yuque_list_group_members",
    description: "List all members of a group or team.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login.")
      },
      required: ["login"]
    }
  },
  {
    name: "yuque_update_group_member",
    description: "Update a group member role.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login."),
        userId: schemaProperty("number", "Yuque user ID."),
        role: schemaProperty("number", "Role: 0 member, 1 admin, 2 owner.")
      },
      required: ["login", "userId", "role"]
    }
  },
  {
    name: "yuque_remove_group_member",
    description: "Remove a member from a group.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login."),
        userId: schemaProperty("number", "Yuque user ID.")
      },
      required: ["login", "userId"]
    }
  },
  {
    name: "yuque_group_stats",
    description: "Get overall statistics for a group.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login.")
      },
      required: ["login"]
    }
  },
  {
    name: "yuque_group_member_stats",
    description: "Get member statistics for a group.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login.")
      },
      required: ["login"]
    }
  },
  {
    name: "yuque_group_book_stats",
    description: "Get repository statistics for a group.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login.")
      },
      required: ["login"]
    }
  },
  {
    name: "yuque_group_doc_stats",
    description: "Get document statistics for a group.",
    inputSchema: {
      type: "object",
      properties: {
        login: schemaProperty("string", "Group login.")
      },
      required: ["login"]
    }
  }
];

const TOOL_HANDLERS = {
  yuque_request: async (args, client) => jsonText(await client.rawRequest(args)),
  yuque_multipart_request: async (args, client) => jsonText(await client.multipartRequest(args)),
  yuque_hello: async (_args, client) => jsonText(await client.hello()),
  yuque_get_user: async (_args, client) => jsonText(await client.getUser()),
  yuque_get_repos: async (args, client) =>
    jsonText(await client.getRepos(args.ownerLogin ? args : args.userId)),
  yuque_list_groups: async (args, client) => jsonText(await client.listGroups(args.userId)),
  yuque_get_repo: async (args, client) => jsonText(await client.getRepo(args)),
  yuque_get_default_repository: async (_args, client) => jsonText(await client.getDefaultRepository()),
  yuque_get_repository_toc_tree: async (args, client) => jsonText(await client.getRepositoryTocTree(args)),
  yuque_get_docs: async (args, client) => jsonText(await client.getDocs(args, args)),
  yuque_get_doc: async (args, client) => jsonText(await client.getDoc(args.docId, args)),
  yuque_create_doc: async (args, client) => jsonText(await client.createDoc(args)),
  yuque_update_doc: async (args, client) => jsonText(await client.updateDoc(args.docId, args)),
  yuque_move_document: async (args, client) => jsonText(await client.moveDocument(args)),
  yuque_create_toc_node: async (args, client) => jsonText(await client.createTocNode(args)),
  yuque_delete_toc_node: async (args, client) => jsonText(await client.deleteTocNode(args)),
  yuque_delete_doc: async (args, client) => {
    await client.deleteDoc(args.docId, args);
    return jsonText({ ok: true, docId: args.docId });
  },
  yuque_search: async (args, client) => jsonText(await client.search(args)),
  yuque_create_repo: async (args, client) => jsonText(await client.createRepo(args)),
  yuque_update_repo: async (args, client) => jsonText(await client.updateRepo(args)),
  yuque_delete_repo: async (args, client) => jsonText(await client.deleteRepo(args)),
  yuque_update_repository_toc: async (args, client) => jsonText(await client.updateToc(args)),
  yuque_list_doc_versions: async (args, client) => jsonText(await client.listDocVersions(args.docId)),
  yuque_get_doc_version: async (args, client) => jsonText(await client.getDocVersion(args.versionId)),
  yuque_list_group_members: async (args, client) => jsonText(await client.listGroupMembers(args.login)),
  yuque_update_group_member: async (args, client) => jsonText(await client.updateGroupMember(args.login, args.userId, args.role)),
  yuque_remove_group_member: async (args, client) => {
    await client.removeGroupMember(args.login, args.userId);
    return jsonText({ ok: true, login: args.login, userId: args.userId });
  },
  yuque_group_stats: async (args, client) => jsonText(await client.getGroupStats(args.login)),
  yuque_group_member_stats: async (args, client) => jsonText(await client.getGroupMemberStats(args.login)),
  yuque_group_book_stats: async (args, client) => jsonText(await client.getGroupBookStats(args.login)),
  yuque_group_doc_stats: async (args, client) => jsonText(await client.getGroupDocStats(args.login))
};

const TOOL_ALIASES = {};

registerAlias(TOOL_ALIASES, "yuque_list_repos", "yuque_get_repos");
registerAlias(TOOL_ALIASES, "yuque_list_docs", "yuque_get_docs");
registerAlias(TOOL_ALIASES, "yuque_get_toc", "yuque_get_repository_toc_tree");
registerAlias(TOOL_ALIASES, "yuque_update_toc", "yuque_update_repository_toc");

export const TOOLS = [
  ...TOOL_DEFINITIONS,
  {
    name: "yuque_list_repos",
    description: "Alias of yuque_get_repos for compatibility with official naming.",
    inputSchema: TOOL_DEFINITIONS.find((tool) => tool.name === "yuque_get_repos").inputSchema
  },
  {
    name: "yuque_list_docs",
    description: "Alias of yuque_get_docs for compatibility with official naming.",
    inputSchema: TOOL_DEFINITIONS.find((tool) => tool.name === "yuque_get_docs").inputSchema
  },
  {
    name: "yuque_get_toc",
    description: "Alias of yuque_get_repository_toc_tree for compatibility with official naming.",
    inputSchema: TOOL_DEFINITIONS.find((tool) => tool.name === "yuque_get_repository_toc_tree").inputSchema
  },
  {
    name: "yuque_update_toc",
    description: "Alias of yuque_update_repository_toc for compatibility with official naming.",
    inputSchema: TOOL_DEFINITIONS.find((tool) => tool.name === "yuque_update_repository_toc").inputSchema
  }
];

export function resolveToolName(name) {
  return TOOL_ALIASES[name] || name;
}

export async function handleTool(name, args, client) {
  const resolvedName = resolveToolName(name);
  const handler = TOOL_HANDLERS[resolvedName];

  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return handler(args, client);
}
