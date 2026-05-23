# ai-design Direction B 测试用例

## 1. Daemon 运行时测试

### T1: Daemon 启动
- **输入**: `pnpm tools-dev start`
- **期望**: daemon 进程启动，端口 3001 监听
- **验证**: `curl localhost:3001/health` 返回 `{"status":"running"}`

### T2: Daemon 停止
- **输入**: `pnpm tools-dev stop`
- **期望**: daemon 进程退出，端口释放
- **验证**: `curl localhost:3001/health` 返回连接拒绝

### T3: Daemon 状态查询
- **输入**: `pnpm tools-dev status`
- **期望**: 显示 daemon 运行状态
- **验证**: 输出包含 "running" 或 "stopped"

### T4: SSE 流式输出
- **输入**: `curl -N localhost:3001/api/events`
- **期望**: 收到 SSE 数据流
- **验证**: 输出包含 `data:` 前缀

## 2. Agent 检测测试

### T5: 检测 Claude Code
- **输入**: PATH 包含 `claude` 命令
- **期望**: Web UI 显示 "Claude Code detected"
- **验证**: 浏览器控制台无错误

### T6: Agent 列表显示
- **输入**: 无
- **期望**: 显示所有检测到的 agents
- **验证**: 至少显示 "No agent detected" 或已检测到的 agent

### T7: Agent Spawn
- **输入**: 点击 "Start Agent" 按钮
- **期望**: 在项目目录中 spawn agent 进程
- **验证**: 进程列表中可见 agent 子进程

### T8: Todo 状态更新
- **输入**: agent 执行任务
- **期望**: Todo 面板显示 in_progress → completed
- **验证**: 状态实时更新

## 3. SQLite 持久化测试

### T9: 数据库初始化
- **输入**: 首次启动 daemon
- **期望**: 创建 `.ai-design/ai-design.db` 数据库
- **验证**: 文件存在且包含 tables

### T10: 项目 CRUD
- **输入**: Web UI 创建项目 "Test Project"
- **期望**: 项目保存到 SQLite
- **验证**: 数据库中可查询到项目记录

### T11: 会话存储
- **输入**: 创建 conversation
- **期望**: messages 表记录消息
- **验证**: 可查询到 message 记录

### T12: Tab 状态
- **输入**: 打开/关闭 tab
- **期望**: tabs 表记录状态
- **验证**: 重新加载后 tab 状态恢复

## 4. API 代理测试

### T13: OpenAI 代理
- **输入**: 配置 OpenAI API key，发送请求
- **期望**: 请求被代理到 OpenAI
- **验证**: 收到有效的 AI 响应

### T14: Anthropic 代理
- **输入**: 配置 Anthropic API key，发送请求
- **期望**: 请求被代理到 Anthropic
- **验证**: 收到有效的 AI 响应

### T15: 自定义端点
- **输入**: 配置自定义 baseUrl + apiKey
- **期望**: 使用自定义端点
- **验证**: 请求成功

### T16: SSRF 防护
- **输入**: 尝试请求内部 IP（如 10.0.0.1）
- **期望**: 请求被阻止
- **验证**: 返回 403 Forbidden

## 5. 端到端测试

### T17: 完整流程
- **输入**: 启动 daemon → 选择 skill → 输入 brief → 查看预览 → 导出 HTML
- **期望**: 全流程正常运行
- **验证**: 所有步骤无错误

### T18: 错误恢复
- **输入**: daemon 异常退出
- **期望**: 自动重启或手动恢复
- **验证**: 数据不丢失

## 验收标准

| 测试 | 状态 |
|------|------|
| T1-T4 Daemon 运行时 | 通过 |
| T5-T8 Agent 检测 | 通过 |
| T9-T12 SQLite 持久化 | 通过 |
| T13-T16 API 代理 | 通过 |
| T17-T18 端到端 | 通过 |