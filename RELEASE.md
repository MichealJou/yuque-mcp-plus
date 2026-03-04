# Release Guide

默认参考日期格式使用 `YYYY-MM-DD`。

## 发布前检查

发布前至少完成这些检查：

- 确认 [package.json](/Users/program/code/code_mcp/yuque-mcp-plus/package.json) 的 `version` 已更新
- 确认 [CHANGELOG.md](/Users/program/code/code_mcp/yuque-mcp-plus/CHANGELOG.md) 已补充本次变更
- 确认 [README.md](/Users/program/code/code_mcp/yuque-mcp-plus/README.md) 和 [README.en.md](/Users/program/code/code_mcp/yuque-mcp-plus/README.en.md) 已同步
- 运行 `npm run check`
- 运行 `npm test`

## 建议发布步骤

### 1. 更新版本

修改：

- [package.json](/Users/program/code/code_mcp/yuque-mcp-plus/package.json)
- [CHANGELOG.md](/Users/program/code/code_mcp/yuque-mcp-plus/CHANGELOG.md)

建议规则：

- 新增功能但不破坏兼容：升 `minor`
- 纯文档或修复小问题：升 `patch`
- 存在不兼容改动：升 `major`

### 2. 执行本地验证

```bash
npm run check
npm test
```

如果这一步失败，不要发布。

### 3. 执行真实联调回归

建议至少回归这些能力：

- `yuque_get_default_repository`
- `yuque_get_repository_toc_tree`
- `yuque_create_toc_node`
- `yuque_delete_toc_node`
- `yuque_create_doc`
- `yuque_move_document`

如果这次改动涉及团队、版本或统计，再额外回归对应工具。

### 4. 更新发布说明

在 [CHANGELOG.md](/Users/program/code/code_mcp/yuque-mcp-plus/CHANGELOG.md) 中记录：

- 新增工具
- 行为变化
- 兼容性说明
- 已验证范围

### 5. 打标签或对外发布

如果你的发布流程需要 Git 标签，建议格式：

```bash
git tag v0.2.0
```

如果后续接 npm 或内部制品库，再补对应发布命令。

## 升级说明模板

可以按这个格式写每次升级说明：

```md
## v0.2.0

### Added
- 新增 `yuque_delete_toc_node`
- 新增根节点自动删除策略

### Changed
- README 改为默认中文
- 补充中英文速查示例

### Verified
- npm run check
- npm test
- 真实 Yuque 联调
```

## 回滚建议

如果新版本有问题，优先按这个顺序处理：

- 切回上一个稳定版本的代码
- 恢复上一个稳定版本的 `package.json` 版本号和文档
- 重新验证 `npm run check` 与 `npm test`
- 如果问题来自真实 API 行为变化，优先在 [README.md](/Users/program/code/code_mcp/yuque-mcp-plus/README.md) 记录临时限制

## 当前版本

当前项目版本：

- `0.2.0`
