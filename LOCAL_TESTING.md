# 🧪 本地测试指南

## 问题说明

**❌ 错误方式**：
```bash
npm run dev  # 只启动前端，API 不可用
```

**✅ 正确方式**：
```bash
vercel dev   # 同时启动前端 + API
```

---

## 📋 本地测试步骤

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 创建 `.env` 文件

在 `frontend/.env` 中添加：

```env
# Supabase（前端）
VITE_SUPABASE_URL=https://nypyccgkrxrvujavplrc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cHljY2drcnhydnVqYXZwbHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDIyOTUsImV4cCI6MjA4MDMxODI5NX0.eOENHTqEJyBK2pbqdXikiR_s8sZaaEQlI2zENOC_kK0

# Supabase（后端 API）
SUPABASE_URL=https://nypyccgkrxrvujavplrc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=在Supabase Dashboard获取

# 第三方 API
FIRECRAWL_API_KEY=fc-7cf8f9100771484db2a48d05f2d6f2b3
DEEPSEEK_API_KEY=sk-e3691fab10fb41058d6ba0d4cef03115
```

**如何获取 Service Role Key**：
1. 访问：https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc/settings/api
2. 找到 **Service Role Key**（以 `eyJhbGci...` 开头的长字符串）
3. 复制到 `.env` 文件

### 3. 安装依赖

```bash
cd frontend
npm install
```

### 4. 启动本地开发服务器

```bash
# 在项目根目录（不是 frontend 目录）
vercel dev
```

**首次运行会询问**：
```
Set up and deploy "~/APD"? [Y/n] 
→ 输入 Y

Which scope do you want to deploy to?
→ 选择你的账号

Link to existing project? [y/N]
→ 输入 N（本地测试不需要链接）

What's your project's name?
→ 输入 apd 或直接回车

In which directory is your code located?
→ 输入 ./ 或直接回车
```

### 5. 访问应用

浏览器打开：**http://localhost:3000**

现在前端和 API 都可以正常工作了！

---

## 🔍 验证 API 是否正常

### 方法 1: 在浏览器控制台测试

打开 http://localhost:3000，按 F12 打开控制台，输入：

```javascript
// 测试搜索 API
fetch('/api/search-work', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '测试' })
})
.then(r => r.json())
.then(console.log)
```

**期望结果**：返回 JSON（不是 404）

### 方法 2: 使用 curl 测试

```bash
# 测试搜索 API
curl -X POST http://localhost:3000/api/search-work \
  -H "Content-Type: application/json" \
  -d '{"query":"测试"}'
```

**期望结果**：
```json
{
  "found": false,
  "message": "No similar works found, can proceed to LLM disambiguation"
}
```

---

## 🐛 常见问题

### Q1: `vercel: command not found`

**原因**：Vercel CLI 未安装

**解决**：
```bash
npm install -g vercel
```

### Q2: 端口 3000 被占用

**解决**：修改端口
```bash
vercel dev --listen 3001
```

### Q3: API 调用返回 500 错误

**原因**：环境变量未配置或配置错误

**解决**：
1. 检查 `frontend/.env` 文件是否存在
2. 确认所有变量都已填写
3. 重启 `vercel dev`

### Q4: `SUPABASE_SERVICE_ROLE_KEY not found`

**原因**：Service Role Key 未配置

**解决**：
1. 访问：https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc/settings/api
2. 复制 **Service Role Key**（⚠️ 不是 Anon Key）
3. 添加到 `frontend/.env`

### Q5: 前端页面空白

**可能原因**：
- 环境变量缺失
- Supabase URL/Key 错误

**解决**：
1. 按 F12 查看浏览器控制台错误
2. 检查 `frontend/.env` 中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

---

## 🔄 开发流程

### 修改前端代码

1. 编辑 `frontend/src/**` 中的文件
2. Vite 会自动热更新（HMR）
3. 刷新浏览器即可看到变化

### 修改 API 代码

1. 编辑 `frontend/api/**` 中的文件
2. **需要重启** `vercel dev`（Serverless Functions 不支持热更新）
3. 或者使用 `vercel dev --listen 3000` 的重载功能

### 查看日志

```bash
# Vercel Dev 会在终端输出日志
# API 调用、错误都会显示
```

---

## 🚀 准备部署

本地测试通过后，部署到生产环境：

```bash
vercel --prod
```

或通过 GitHub 自动部署（推荐）。

---

## 📊 本地 vs 生产环境

| 项目 | 本地开发 | 生产环境 |
|------|---------|---------|
| 命令 | `vercel dev` | `vercel --prod` |
| 地址 | http://localhost:3000 | https://你的项目.vercel.app |
| 前端 | Vite Dev Server | Vercel CDN |
| API | 本地 Node.js | Vercel Serverless |
| 环境变量 | `frontend/.env` | Vercel Dashboard |
| 热更新 | 前端 ✅ / API ❌ | N/A |

---

## ✅ 测试清单

在本地测试以下功能：

- [ ] ✅ 主页加载正常
- [ ] ✅ 用户登录/注册
- [ ] ✅ 点击"扫描"按钮
- [ ] ✅ 输入作品名搜索
- [ ] ✅ 观察完整流程（搜索→消歧→抓取）
- [ ] ✅ 查看作品详情页
- [ ] ✅ 角色投票功能
- [ ] ✅ 评论功能

---

## 📚 相关文档

- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - 生产环境部署
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境变量配置

---

## 💡 小贴士

1. **优先使用 `vercel dev`** - 它完全模拟生产环境
2. **`.env` 文件不要提交到 Git** - 已在 `.gitignore` 中
3. **API 修改需要重启** - Serverless Functions 不支持热更新
4. **查看终端日志** - 所有 API 调用和错误都会显示

---

Happy coding! 🎉

