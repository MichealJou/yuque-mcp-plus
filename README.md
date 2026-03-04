# yuque-mcp-plus

语雀 MCP 服务。

它在现有 `yuque-mcp-server` 的基础上补了几类关键能力：

- 默认知识库解析
- 知识库 TOC/目录树查询
- 支持 `parentUuid` 的文档创建
- 文档与目录节点移动
- 目录节点创建与删除
- 官方命名兼容别名
- 通用 OpenAPI 透传 `yuque_request`
- 通用 multipart 上传透传 `yuque_multipart_request`

英文文档见 [README.en.md](README.en.md)。

## 适用场景

适合这些语雀自动化需求：

- 按目录结构维护知识库
- 在指定目录下创建文档
- 批量重组目录或文档位置
- 通过 MCP 给 AI 助手提供稳定的语雀管理能力
- 在官方工具未覆盖的接口上，通过通用请求继续扩展

## 当前状态

已经完成并验证：

- `yuque_get_default_repository`
- `yuque_get_repository_toc_tree`
- `yuque_create_doc` + `parentUuid`
- `yuque_move_document`
- `yuque_create_toc_node`
- `yuque_delete_toc_node`
- 根节点自动删除
- 官方兼容别名工具

真实联调已通过的能力：

- 创建根目录节点
- 在目录节点下创建文档
- 移动目录节点
- 删除目录节点
- 删除测试文档

## 环境变量

必填：

- `YUQUE_TOKEN`

可选：

- `YUQUE_API_BASE_URL`
- `YUQUE_TIMEOUT_MS`
- `YUQUE_RETRIES`
- `YUQUE_DEFAULT_REPO_ID`
- `YUQUE_DEFAULT_REPO_NAMESPACE`

说明：

- `YUQUE_DEFAULT_REPO_ID` 优先级高于 `YUQUE_DEFAULT_REPO_NAMESPACE`
- 两者都不填时，会回退到当前账号可访问的第一个知识库

## 运行方式

通过 npm 直接运行：

```bash
npx yuque-mcp-plus
```

如果要带环境变量：

```bash
YUQUE_TOKEN="your-token" npx yuque-mcp-plus
```

直接启动：

```bash
node ./src/index.js
```

本地检查：

```bash
npm run check
```

本地测试：

```bash
npm test
```

版本变更记录：

- [CHANGELOG.md](/Users/program/code/code_mcp/yuque-mcp-plus/CHANGELOG.md)

发布步骤：

- [RELEASE.md](/Users/program/code/code_mcp/yuque-mcp-plus/RELEASE.md)

## Codex MCP 配置示例

如果你想在本地源码和 npm 已发布包之间切换，可以直接替换 `command + args`。

源码模式：

```toml
[mcp_servers.yuque]
command = "node"
args = [ "/Users/program/code/code_mcp/yuque-mcp-plus/src/index.js" ]

[mcp_servers.yuque.env]
YUQUE_TOKEN = "your-token"
```

npm 模式：

```toml
[mcp_servers.yuque]
command = "npx"
args = [ "-y", "yuque-mcp-plus" ]

[mcp_servers.yuque.env]
YUQUE_TOKEN = "your-token"
```

## 其他客户端接入

下面这些示例基于 2026-03-04 当天可查到的客户端文档整理。不同版本的 UI 或配置文件位置可能会变，但本地 `stdio` 启动方式基本一致。

### Claude Code

官方文档当前推荐直接用命令注册本地 `stdio` MCP：

源码模式：

```bash
claude mcp add --transport stdio yuque -- node /Users/program/code/code_mcp/yuque-mcp-plus/src/index.js
```

npm 模式：

```bash
claude mcp add --transport stdio yuque -- npx -y yuque-mcp-plus
```

如果要带环境变量：

```bash
claude mcp add --transport stdio --env YUQUE_TOKEN=your-token yuque -- node /Users/program/code/code_mcp/yuque-mcp-plus/src/index.js
claude mcp add --transport stdio --env YUQUE_TOKEN=your-token yuque -- npx -y yuque-mcp-plus
```

常用管理命令：

```bash
claude mcp list
claude mcp get yuque
```

如果你使用项目共享配置，也可以把它写进项目根目录的 `.mcp.json`：

源码模式：

```json
{
  "mcpServers": {
    "yuque": {
      "command": "node",
      "args": [
        "/Users/program/code/code_mcp/yuque-mcp-plus/src/index.js"
      ],
      "env": {
        "YUQUE_TOKEN": "${YUQUE_TOKEN}"
      }
    }
  }
}
```

npm 模式：

```json
{
  "mcpServers": {
    "yuque": {
      "command": "npx",
      "args": [
        "-y",
        "yuque-mcp-plus"
      ],
      "env": {
        "YUQUE_TOKEN": "${YUQUE_TOKEN}"
      }
    }
  }
}
```

### Qoder

Qoder 当前支持在设置页里直接添加 MCP。

操作路径：

- 打开 Qoder Settings
- 进入 `MCP`
- 在 `My Servers` 里点击 `+ Add`
- 粘贴 JSON 配置并保存

本项目可直接使用：

源码模式：

```json
{
  "mcpServers": {
    "yuque": {
      "command": "node",
      "args": [
        "/Users/program/code/code_mcp/yuque-mcp-plus/src/index.js"
      ],
      "env": {
        "YUQUE_TOKEN": "your-token"
      }
    }
  }
}
```

npm 模式：

```json
{
  "mcpServers": {
    "yuque": {
      "command": "npx",
      "args": [
        "-y",
        "yuque-mcp-plus"
      ],
      "env": {
        "YUQUE_TOKEN": "your-token"
      }
    }
  }
}
```

保存后如果能看到连接图标，说明服务已成功连上。使用时要切到 `Agent mode`，这样 Qoder 才会调用 MCP 工具。

### OpenCode

OpenCode 当前在 `opencode.jsonc` 里配置 MCP。本地 MCP 要放在 `mcp` 字段下，并声明为 `type: "local"`。

示例：

源码模式：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "yuque": {
      "type": "local",
      "command": [
        "node",
        "/Users/program/code/code_mcp/yuque-mcp-plus/src/index.js"
      ],
      "enabled": true,
      "environment": {
        "YUQUE_TOKEN": "your-token"
      }
    }
  }
}
```

npm 模式：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "yuque": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "yuque-mcp-plus"
      ],
      "enabled": true,
      "environment": {
        "YUQUE_TOKEN": "your-token"
      }
    }
  }
}
```

使用时可以在提示词里直接点名，例如：

```text
use the yuque tool to list my repositories
```

### Trae

Trae 已经支持 MCP，但我当前没查到和 Qoder/OpenCode 一样完整公开的本地配置文件格式文档。所以这里按目前公开的接入方式写最稳的 UI 配置步骤。

常见操作路径：

- 打开聊天框
- 点击右上角齿轮
- 进入 `MCP`
- 添加一个本地 `STDIO` 服务

建议填写：

源码模式：

- Name: `yuque`
- Command: `node`
- Args: `/Users/program/code/code_mcp/yuque-mcp-plus/src/index.js`
- Env: `YUQUE_TOKEN=your-token`

npm 模式：

- Name: `yuque`
- Command: `npx`
- Args: `-y yuque-mcp-plus`
- Env: `YUQUE_TOKEN=your-token`

说明：

- Trae 的具体入口位置和字段名可能会随版本变化
- 如果你的版本支持 JSON 配置导入，可以直接复用 Qoder 的那份 `mcpServers` 配置
- 如果是通过界面逐项填写，本项目本质上只需要 `command + args + env`

## 工具清单

### 核心工具

| 工具 | 用途 | 常用关键参数 |
| --- | --- | --- |
| `yuque_hello` | 检查服务和 token 是否可用 | 无 |
| `yuque_request` | 通用 OpenAPI 透传 | `method`, `path`, `params`, `body` |
| `yuque_multipart_request` | 通用 multipart 上传请求，适合附件类接口 | `method`, `path`, `params`, `fields`, `files` |
| `yuque_get_user` | 获取当前用户信息 | 无 |
| `yuque_get_repos` | 获取知识库列表 | `ownerLogin`, `ownerType`, `userId` |
| `yuque_list_groups` | 获取当前用户或指定用户的团队列表 | `userId` |
| `yuque_get_repo` | 获取单个知识库详情 | `repoId`, `repoNamespace` |
| `yuque_get_default_repository` | 解析默认知识库 | 无 |
| `yuque_search` | 搜索文档或知识库内容 | `query`, `type`, `repoId`, `page` |

### 知识库与文档

| 工具 | 用途 | 常用关键参数 |
| --- | --- | --- |
| `yuque_get_docs` | 列出知识库文档 | `repoId`, `repoNamespace`, `limit`, `offset` |
| `yuque_get_doc` | 获取单篇文档详情 | `docId`, `repoId`, `repoNamespace` |
| `yuque_create_doc` | 创建文档，可挂到目录节点下 | `repoId`, `title`, `body`, `format`, `parentUuid` |
| `yuque_update_doc` | 更新文档标题或正文 | `docId`, `title`, `body`, `format` |
| `yuque_delete_doc` | 删除文档 | `docId`, `repoId`, `repoNamespace` |
| `yuque_create_repo` | 创建知识库 | `name`, `slug`, `description`, `ownerLogin`, `ownerType` |
| `yuque_update_repo` | 更新知识库配置 | `repoId`, `repoNamespace`, `name`, `slug`, `description`, `isPublic` |
| `yuque_delete_repo` | 删除知识库 | `repoId`, `repoNamespace` |

### TOC 与结构调整

| 工具 | 用途 | 常用关键参数 |
| --- | --- | --- |
| `yuque_get_repository_toc_tree` | 获取完整目录树 | `repoId`, `repoNamespace` |
| `yuque_create_toc_node` | 创建目录或链接节点 | `repoId`, `title`, `nodeType`, `parentUuid`, `actionMode`, `position` |
| `yuque_delete_toc_node` | 删除目录节点，支持根节点自动推导 | `repoId`, `nodeUuid`, `parentUuid` |
| `yuque_move_document` | 移动文档或目录节点 | `repoId`, `docId` 或 `nodeUuid`, `parentUuid`, `actionMode`, `position` |
| `yuque_update_repository_toc` | 直接透传底层 TOC 更新 | `repoId`, `repoNamespace`, `payload` |

### 版本、团队与统计

| 工具 | 用途 | 常用关键参数 |
| --- | --- | --- |
| `yuque_list_doc_versions` | 获取文档版本列表 | `docId` |
| `yuque_get_doc_version` | 获取某个文档版本详情 | `versionId` |
| `yuque_list_group_members` | 获取团队成员列表 | `login` |
| `yuque_update_group_member` | 更新团队成员角色 | `login`, `userId`, `role` |
| `yuque_remove_group_member` | 移除团队成员 | `login`, `userId` |
| `yuque_group_stats` | 获取团队总统计 | `login` |
| `yuque_group_member_stats` | 获取团队成员统计 | `login` |
| `yuque_group_book_stats` | 获取团队知识库统计 | `login` |
| `yuque_group_doc_stats` | 获取团队文档统计 | `login` |

### 兼容别名

| 别名 | 实际工具 |
| --- | --- |
| `yuque_list_repos` | `yuque_get_repos` |
| `yuque_list_docs` | `yuque_get_docs` |
| `yuque_get_toc` | `yuque_get_repository_toc_tree` |
| `yuque_update_toc` | `yuque_update_repository_toc` |

## 常用调用示例

### 1. 获取默认知识库

```json
{}
```

对应工具：

- `yuque_get_default_repository`

### 2. 获取知识库目录树

```json
{
  "repoId": 63978478
}
```

对应工具：

- `yuque_get_repository_toc_tree`

### 3. 在指定目录下创建文档

```json
{
  "repoId": 63978478,
  "title": "新文档",
  "body": "# 标题\n\n正文",
  "format": "markdown",
  "parentUuid": "-W39TNJu_tufwcVm"
}
```

对应工具：

- `yuque_create_doc`

### 4. 创建目录节点

```json
{
  "repoId": 63978478,
  "title": "新目录",
  "nodeType": "TITLE",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

如果不传 `parentUuid`，则创建在根层级。

对应工具：

- `yuque_create_toc_node`

### 5. 删除目录节点

最简单的调用方式：

```json
{
  "repoId": 63978478,
  "nodeUuid": "CxEXaBKTPFRKaopb"
}
```

说明：

- 对子节点，服务会自动解析 `parent_uuid`
- 对根节点，服务会自动解析删除策略
- 你也可以手动传 `parentUuid` 覆盖自动推导

对应工具：

- `yuque_delete_toc_node`

### 6. 移动文档或目录节点

```json
{
  "repoId": 63978478,
  "nodeUuid": "Mir36kbfs2f4g130",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

如果是移动文档，也可以传：

```json
{
  "repoId": 63978478,
  "docId": 259413650,
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

对应工具：

- `yuque_move_document`

### 7. 通用 OpenAPI 请求

```json
{
  "method": "GET",
  "path": "/user"
}
```

或：

```json
{
  "method": "GET",
  "path": "/search",
  "params": {
    "q": "联商客",
    "type": "doc"
  }
}
```

对应工具：

- `yuque_request`

## 工具速查示例

下面这部分按工具拆开，适合复制后直接改参数。

### `yuque_get_default_repository`

```json
{}
```

### `yuque_get_repos`

```json
{}
```

按用户或团队过滤：

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

创建根目录：

```json
{
  "repoId": 63978478,
  "title": "一级目录",
  "nodeType": "TITLE"
}
```

创建子目录：

```json
{
  "repoId": 63978478,
  "title": "二级目录",
  "nodeType": "TITLE",
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

### `yuque_delete_toc_node`

自动删除目录节点：

```json
{
  "repoId": 63978478,
  "nodeUuid": "CxEXaBKTPFRKaopb"
}
```

### `yuque_create_doc`

创建根层级文档：

```json
{
  "repoId": 63978478,
  "title": "根文档",
  "body": "# 标题\n\n正文",
  "format": "markdown"
}
```

创建到目录下：

```json
{
  "repoId": 63978478,
  "title": "目录文档",
  "body": "# 标题\n\n正文",
  "format": "markdown",
  "parentUuid": "-W39TNJu_tufwcVm"
}
```

### `yuque_update_doc`

```json
{
  "docId": 259413650,
  "title": "更新后的标题",
  "body": "# 新标题\n\n新正文",
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

按文档移动：

```json
{
  "repoId": 63978478,
  "docId": 259413650,
  "parentUuid": "-W39TNJu_tufwcVm",
  "actionMode": "child",
  "position": "append"
}
```

按目录节点移动：

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
  "query": "联商客",
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

查询当前用户：

```json
{
  "method": "GET",
  "path": "/user"
}
```

评论类请求示例：

```json
{
  "method": "POST",
  "path": "/repos/63978478/docs/259413650/comments",
  "body": {
    "body": "这是一条评论"
  }
}
```

### `yuque_multipart_request`

附件上传类请求示例：

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

底层 TOC 更新：

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

## 命名兼容说明

为了兼容官方 `yuque/yuque-mcp-server` 的命名习惯，项目提供了这些别名：

- `yuque_list_repos` -> `yuque_get_repos`
- `yuque_list_docs` -> `yuque_get_docs`
- `yuque_get_toc` -> `yuque_get_repository_toc_tree`
- `yuque_update_toc` -> `yuque_update_repository_toc`

## 已知边界

- 评论暂未封装成专用工具，建议通过 `yuque_request` 访问
- 附件暂未封装成官方专用工具，但现在可通过 `yuque_multipart_request` 处理上传类接口
- `yuque_update_repository_toc` 属于底层透传工具，适合高级场景

说明：

- 我已核对官方 `openapi-metadata` 和 `sdk`
- 其中没有明确公开 comments / attachments 的专用 OpenAPI 定义
- 所以当前实现选择“补强通用能力”，而不是硬编码猜测端点

## 真实联调记录

以下场景已经在真实语雀知识库里跑通过：

### 默认知识库解析

- `yuque_get_default_repository` 可以正常返回默认知识库
- 返回中会带 `_defaultSource`
- 该字段用于标记默认知识库的解析来源，方便排查配置问题

### 目录树查询

- `yuque_get_repository_toc_tree` 可以正确返回 `TITLE`、`DOC` 和层级关系
- 已验证返回字段中包含 `uuid`、`parent_uuid`、`prev_uuid`、`sibling_uuid`

### 在目录下创建文档

- `yuque_create_doc` 传入 `parentUuid` 后，可以先创建文档，再正确挂载到指定目录下
- 已验证创建出的文档在 TOC 中可见，且 `parent_uuid` 正确

### 文档移动

- `yuque_move_document` 已验证支持：
- 通过 `docId` 移动文档
- 通过 `nodeUuid` 移动 TOC 节点
- 可在根层级与目录层级之间移动

### 创建目录节点

- `yuque_create_toc_node` 已验证可创建根层级 `TITLE`
- 也已验证可创建子级目录节点

### 删除目录节点

- `yuque_delete_toc_node` 已验证可删除：
- 有父目录的普通目录节点
- 根层级目录节点
- 对根节点删除时，服务会自动推导正确的删除策略

### 清理测试数据

- 测试过程中创建的临时文档和临时目录节点都已成功删除
- 当前实现已经适合做日常知识库结构维护

## 常见报错处理

### `Missing YUQUE_TOKEN`

原因：

- 没有注入 `YUQUE_TOKEN`
- 终端手动运行时忘记带环境变量

处理：

- 检查 `config.toml` 里的 `[mcp_servers.yuque.env]`
- 或者在终端启动时显式传入：

```bash
YUQUE_TOKEN="your-token" node ./src/index.js
```

### `doc not found`

原因：

- 文档 ID 不存在
- 文档已经被删除
- 仓库不匹配

处理：

- 先用 `yuque_get_docs` 或 `yuque_get_doc` 确认 `docId`
- 确认 `repoId` 或 `repoNamespace` 正确

### `action invalid`

原因：

- 传给 `yuque_update_repository_toc` 的底层 `action` 不符合语雀实际支持的值

处理：

- 优先使用上层工具：
- `yuque_create_toc_node`
- `yuque_delete_toc_node`
- `yuque_move_document`
- 只有在高级场景下再使用 `yuque_update_repository_toc`

### `missing action_mode`

原因：

- 调用 TOC 更新接口时缺少 `action_mode`

处理：

- 尽量不要手写 TOC 底层 payload
- 对删除目录节点，优先使用 `yuque_delete_toc_node`

### `action_mode invalid`

原因：

- `action_mode` 与当前操作不匹配

处理：

- 删除子节点通常对应 `child`
- 删除根层级节点通常需要通过相邻节点推导 `sibling`
- 该逻辑已经封装在 `yuque_delete_toc_node` 中

### `getaddrinfo ENOTFOUND www.yuque.com`

原因：

- 当前运行环境没有网络
- 被沙箱或代理限制

处理：

- 在允许联网的环境执行真实联调
- 在 Codex 中如遇沙箱网络限制，需要提权后重跑

### 工具新增后当前会话里看不到

原因：

- MCP 配置已更新，但当前会话工具面没有热刷新

处理：

- 重启 Codex
- 重启后重新进入会话，再次调用新工具

## 项目结构

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

## 开发说明

核心实现位置：

- 配置读取：[src/config.js](/Users/program/code/code_mcp/yuque-mcp-plus/src/config.js)
- MCP 服务入口：[src/server.js](/Users/program/code/code_mcp/yuque-mcp-plus/src/server.js)
- 工具定义与分发：[src/tools.js](/Users/program/code/code_mcp/yuque-mcp-plus/src/tools.js)
- 语雀 API 客户端：[src/yuque-client.js](/Users/program/code/code_mcp/yuque-mcp-plus/src/yuque-client.js)

测试文件：

- [tests/tools.test.js](/Users/program/code/code_mcp/yuque-mcp-plus/tests/tools.test.js)
- [tests/yuque-client.test.js](/Users/program/code/code_mcp/yuque-mcp-plus/tests/yuque-client.test.js)
