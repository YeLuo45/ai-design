# ai-design Direction A — Test Cases

## 项目信息
- **Project**: PRJ-20260524-001 - ai-design
- **Git Repo**: https://github.com/YeLuo45/ai-design
- **Local Path**: /home/hermes/projects/ai-design
- **开发分支**: feature/direction-a
- **部署分支**: gh-pages

---

## 验收测试用例

### 1. 项目初始化

- [ ] `pnpm install` 成功安装依赖
- [ ] `pnpm tools-dev` 能成功启动（不报端口占用错误）
- [ ] Web UI 在 localhost 可访问

### 2. Daemon 运行时

- [ ] PATH 上有 Coding Agent CLI 时能正确检测
- [ ] 能启动 daemon 进程
- [ ] `pnpm tools-dev status` 显示正确状态

### 3. Web 前端

- [ ] 首页加载显示欢迎界面
- [ ] 能选择 Skill（web-prototype / dashboard / mobile-app）
- [ ] 能输入 brief 并提交

### 4. 技能系统

- [ ] skills/web-prototype 目录结构正确
- [ ] skills/dashboard 目录结构正确
- [ ] skills/mobile-app 目录结构正确
- [ ] SKILL.md 符合 Claude Code 规范

### 5. 设计系统

- [ ] tailwindcss 集成完成
- [ ] 能选择视觉方向
- [ ] 设备帧（iPhone/MacBook）可用

### 6. 预览与导出

- [ ] artifact 能在沙箱 iframe 渲染
- [ ] HTML 导出功能正常
- [ ] 移动端原型带设备 chrome

---

## 执行命令

```bash
# 初始化项目
cd /home/hermes/projects/ai-design
pnpm install

# 构建验证
pnpm build

# 开发模式启动
pnpm tools-dev
```

## 预期输出

构建产物在 `dist/` 目录，可部署到 GitHub Pages。