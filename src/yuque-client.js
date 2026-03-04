import axios from "axios";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

export class YuqueApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "YuqueApiError";
    this.status = options.status;
    this.code = options.code;
    this.response = options.response;
  }
}

function slugify(value) {
  const normalized = String(value)
    .toLowerCase()
    .replace(/[\u4e00-\u9fa5]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || `item-${Date.now()}`;
}

function isRetryable(error) {
  if (!(error instanceof YuqueApiError)) {
    return true;
  }

  if (!error.status) {
    return true;
  }

  return error.status >= 500;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class YuqueClient {
  constructor(config) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.timeoutMs,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "yuque-mcp-plus/0.2.0",
        "X-Auth-Token": config.token
      }
    });

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        const data = error.response?.data;
        throw new YuqueApiError(
          data?.message || error.message || "Unknown Yuque API error",
          {
            status: error.response?.status,
            code: data?.code,
            response: data
          }
        );
      }
    );
  }

  async request(url, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.config.retries; attempt += 1) {
      try {
        const response = await this.http.request({
          url,
          ...options
        });

        return response.data?.data ?? response.data;
      } catch (error) {
        lastError = error;

        if (!isRetryable(error) || attempt >= this.config.retries) {
          break;
        }

        await sleep(2 ** attempt * 250);
      }
    }

    throw lastError;
  }

  async rawRequest(args = {}) {
    const method = String(args.method || "GET").toUpperCase();
    const path = args.path || "/";
    const query = this.buildQueryString(args.params);

    return this.request(`${path}${query}`, {
      method,
      data: args.body
    });
  }

  async multipartRequest(args = {}) {
    const method = String(args.method || "POST").toUpperCase();
    const path = args.path || "/";
    const query = this.buildQueryString(args.params);
    const form = new FormData();
    const fields = args.fields || {};
    const files = Array.isArray(args.files) ? args.files : [];

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) {
        continue;
      }

      form.append(key, String(value));
    }

    for (const file of files) {
      if (!file?.fieldName || !file?.filePath) {
        throw new YuqueApiError("Each multipart file requires fieldName and filePath");
      }

      const buffer = await readFile(file.filePath);
      const blob = new Blob([buffer], {
        type: file.contentType || "application/octet-stream"
      });

      form.append(file.fieldName, blob, file.filename || basename(file.filePath));
    }

    return this.request(`${path}${query}`, {
      method,
      data: form
    });
  }

  buildQueryString(params) {
    if (!params || typeof params !== "object") {
      return "";
    }

    const pairs = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]);

    if (pairs.length === 0) {
      return "";
    }

    return `?${new URLSearchParams(pairs).toString()}`;
  }

  async hello() {
    return this.request("/hello");
  }

  async getUser() {
    return this.request("/user");
  }

  async getRepos(userId) {
    if (userId && typeof userId === "object") {
      const ownerType = userId.ownerType || "user";
      const ownerLogin = userId.ownerLogin;

      if (ownerLogin) {
        const ownerPath = ownerType === "group" ? "groups" : "users";
        return this.request(`/${ownerPath}/${ownerLogin}/repos`);
      }
    }

    const resolvedUserId = userId || String((await this.getUser()).id);
    return this.request(`/users/${resolvedUserId}/repos`);
  }

  async listGroups(userId) {
    const resolvedUserId = userId || (await this.getUser()).id;
    return this.request(`/users/${resolvedUserId}/groups`);
  }

  async resolveRepoIdentifier({ repoId, repoNamespace } = {}) {
    if (repoId) {
      return String(repoId);
    }

    if (repoNamespace) {
      return String(repoNamespace);
    }

    const defaultRepo = await this.getDefaultRepository();
    return String(defaultRepo.id || defaultRepo.namespace);
  }

  async getDefaultRepository() {
    const repos = await this.getRepos();

    if (!Array.isArray(repos) || repos.length === 0) {
      throw new YuqueApiError("No Yuque repositories available for the current user");
    }

    if (this.config.defaultRepoId) {
      const matched = repos.find((repo) => String(repo.id) === String(this.config.defaultRepoId));
      if (matched) {
        return { ...matched, _defaultSource: "YUQUE_DEFAULT_REPO_ID" };
      }
    }

    if (this.config.defaultRepoNamespace) {
      const matched = repos.find((repo) => repo.namespace === this.config.defaultRepoNamespace);
      if (matched) {
        return { ...matched, _defaultSource: "YUQUE_DEFAULT_REPO_NAMESPACE" };
      }
    }

    const namedDefault = repos.find((repo) => /default/i.test(repo.name || "") || /default/i.test(repo.slug || ""));
    if (namedDefault) {
      return { ...namedDefault, _defaultSource: "name-match" };
    }

    return { ...repos[0], _defaultSource: "first-repo-fallback" };
  }

  async getRepositoryTocTree(refs = {}) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    return this.request(`/repos/${repoRef}/toc`);
  }

  async getRepo(refs = {}) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    return this.request(`/repos/${repoRef}`);
  }

  async updateRepo(args = {}) {
    const repoRef = await this.resolveRepoIdentifier(args);
    const data = {};

    if (typeof args.name === "string") {
      data.name = args.name;
    }
    if (typeof args.slug === "string") {
      data.slug = args.slug;
    }
    if (typeof args.description === "string") {
      data.description = args.description;
    }
    if (typeof args.isPublic === "boolean") {
      data.public = args.isPublic ? 1 : 0;
    }

    return this.request(`/repos/${repoRef}`, {
      method: "PUT",
      data
    });
  }

  async deleteRepo(refs = {}) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    return this.request(`/repos/${repoRef}`, {
      method: "DELETE"
    });
  }

  async updateRepositoryToc(refs, payload) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    return this.request(`/repos/${repoRef}/toc`, {
      method: "PUT",
      data: payload
    });
  }

  async getDocs(refs = {}, options = {}) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    const params = new URLSearchParams();

    if (options.limit) {
      params.set("limit", String(options.limit));
    }

    if (options.offset) {
      params.set("offset", String(options.offset));
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/repos/${repoRef}/docs${suffix}`);
  }

  async getDoc(docId, refs = {}) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    return this.request(`/repos/${repoRef}/docs/${docId}`);
  }

  async createDoc(args = {}) {
    const repoRef = await this.resolveRepoIdentifier(args);
    const created = await this.request(`/repos/${repoRef}/docs`, {
      method: "POST",
      data: {
        title: args.title,
        slug: args.slug || slugify(args.title),
        body: args.body || "",
        format: args.format || "markdown"
      }
    });

    if (args.parentUuid) {
      await this.attachDocToParent(
        { repoId: args.repoId, repoNamespace: args.repoNamespace },
        created.id,
        args.parentUuid
      );
    }

    return created;
  }

  async updateDoc(docId, args = {}) {
    const repoRef = await this.resolveRepoIdentifier(args);
    const data = {};

    if (typeof args.title === "string") {
      data.title = args.title;
    }

    if (typeof args.body === "string") {
      data.body = args.body;
    }

    if (typeof args.format === "string") {
      data.format = args.format;
    }

    return this.request(`/repos/${repoRef}/docs/${docId}`, {
      method: "PUT",
      data
    });
  }

  async deleteDoc(docId, refs = {}) {
    const repoRef = await this.resolveRepoIdentifier(refs);
    await this.request(`/repos/${repoRef}/docs/${docId}`, {
      method: "DELETE"
    });
  }

  async search(args = {}) {
    const params = new URLSearchParams({
      q: args.query,
      type: String(args.type || "DOC").toLowerCase(),
      page: String(args.page || 1)
    });

    if (args.repoId) {
      params.set("repo_id", String(args.repoId));
    }

    return this.request(`/search?${params.toString()}`);
  }

  async createRepo(args = {}) {
    const user = await this.getUser();
    const ownerType = args.ownerType === "group" ? "groups" : "users";
    const ownerLogin = args.ownerLogin || user.login || String(user.id);
    return this.request(`/${ownerType}/${ownerLogin}/repos`, {
      method: "POST",
      data: {
        name: args.name,
        slug: args.slug || slugify(args.name),
        description: args.description || "",
        public: args.isPublic ? 1 : 0,
        type: "Book"
      }
    });
  }

  async listGroupMembers(login) {
    return this.request(`/groups/${login}/users`);
  }

  async updateGroupMember(login, userId, role) {
    return this.request(`/groups/${login}/users/${userId}`, {
      method: "PUT",
      data: { role }
    });
  }

  async removeGroupMember(login, userId) {
    return this.request(`/groups/${login}/users/${userId}`, {
      method: "DELETE"
    });
  }

  async getGroupStats(login) {
    return this.request(`/groups/${login}/statistics`);
  }

  async getGroupMemberStats(login) {
    return this.request(`/groups/${login}/statistics/members`);
  }

  async getGroupBookStats(login) {
    return this.request(`/groups/${login}/statistics/books`);
  }

  async getGroupDocStats(login) {
    return this.request(`/groups/${login}/statistics/docs`);
  }

  async listDocVersions(docId) {
    return this.request("/doc_versions", {
      method: "GET",
      params: { doc_id: docId }
    });
  }

  async getDocVersion(versionId) {
    return this.request(`/doc_versions/${versionId}`);
  }

  async createTocNode(args = {}) {
    const action = args.position === "prepend" ? "prependNode" : "appendNode";
    return this.updateRepositoryToc(args, {
      action,
      action_mode: args.actionMode || "child",
      target_uuid: args.targetUuid || args.parentUuid || undefined,
      type: args.nodeType || "TITLE",
      title: args.title,
      url: args.url
    });
  }

  async deleteTocNode(args = {}) {
    if (!args.nodeUuid) {
      throw new YuqueApiError("nodeUuid is required to delete a TOC node");
    }

    const strategy = await this.resolveDeleteTocStrategy(args);

    return this.updateRepositoryToc(args, {
      action: "removeNode",
      action_mode: strategy.actionMode,
      target_uuid: strategy.targetUuid,
      node_uuid: args.nodeUuid
    });
  }

  async resolveDeleteTocStrategy(args = {}) {
    if (args.parentUuid || args.targetUuid) {
      return {
        actionMode: args.actionMode || "child",
        targetUuid: args.parentUuid || args.targetUuid
      };
    }

    const toc = await this.getRepositoryTocTree(args);
    const node = this.findTocNodeByUuid(toc, args.nodeUuid);

    if (!node) {
      throw new YuqueApiError(`Unable to find TOC node ${args.nodeUuid}`);
    }

    if (node.parent_uuid) {
      return {
        actionMode: "child",
        targetUuid: node.parent_uuid
      };
    }

    if (node.prev_uuid) {
      return {
        actionMode: "sibling",
        targetUuid: node.prev_uuid
      };
    }

    if (node.sibling_uuid) {
      return {
        actionMode: "sibling",
        targetUuid: node.sibling_uuid
      };
    }

    throw new YuqueApiError("Unable to infer delete strategy for a standalone root TOC node");
  }

  findTocNodeByUuid(toc, nodeUuid) {
    const items = Array.isArray(toc) ? toc : [];
    return items.find((item) => item?.uuid === nodeUuid) || null;
  }

  async updateToc(args = {}) {
    return this.updateRepositoryToc(args, args.payload || {});
  }

  async attachDocToParent(refs, docId, parentUuid) {
    return this.updateRepositoryToc(refs, {
      action: "appendNode",
      action_mode: "child",
      target_uuid: parentUuid,
      type: "DOC",
      doc_ids: [docId]
    });
  }

  async moveDocument(args = {}) {
    const nodeUuid = args.nodeUuid || (await this.findNodeUuidByDocId(args.docId, args));
    const action = args.position === "prepend" ? "prependNode" : "appendNode";

    return this.updateRepositoryToc(args, {
      action,
      action_mode: args.actionMode || "child",
      target_uuid: args.parentUuid || args.targetUuid || undefined,
      node_uuid: nodeUuid
    });
  }

  async findNodeUuidByDocId(docId, refs = {}) {
    if (!docId && docId !== 0) {
      throw new YuqueApiError("docId is required when nodeUuid is not provided");
    }

    const toc = await this.getRepositoryTocTree(refs);
    const queue = Array.isArray(toc) ? [...toc] : [];

    while (queue.length > 0) {
      const node = queue.shift();
      if (!node || typeof node !== "object") {
        continue;
      }

      if (String(node.doc_id) === String(docId) || String(node.docId) === String(docId)) {
        return node.uuid;
      }

      if (Array.isArray(node.children)) {
        queue.push(...node.children);
      }
    }

    throw new YuqueApiError(`Unable to find TOC node for docId ${docId}`);
  }
}
