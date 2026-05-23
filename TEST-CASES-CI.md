# TEST-CASES-CI.md - CI/CD 自动化测试用例

## 测试目标
验证 CI/CD 流水线配置正确性，确保构建和部署流程可靠。

## 测试用例

### TC-001: Workflow 文件存在性
- **描述**: 验证 GitHub Actions workflow 文件存在
- **文件**: `.github/workflows/ci.yml`
- **预期**: 文件存在且为有效 YAML

### TC-002: Node.js 版本配置
- **描述**: 验证 workflow 使用正确的 Node.js 版本
- **检查项**: `node-version: '20'`
- **预期**: 版本为 20.x

### TC-003: pnpm 安装配置
- **描述**: 验证 pnpm action-setup 版本
- **检查项**: `pnpm/action-setup@v4`
- **预期**: 版本为 v4

### TC-004: 测试命令配置
- **描述**: 验证测试命令正确配置
- **检查项**: `pnpm test`
- **预期**: 测试命令在构建前执行

### TC-005: 部署条件
- **描述**: 验证部署到 gh-pages 的条件
- **检查项**: `if: github.ref == 'refs/heads/master'`
- **预期**: 仅在 master 分支触发部署

### TC-006: 构建产物路径
- **描述**: 验证构建产物在 dist/web 目录
- **检查项**: `cd dist/web`
- **预期**: 构建产物路径正确

---

## 验收标准
- 测试通过率 >= 80% (至少 5/6 通过)