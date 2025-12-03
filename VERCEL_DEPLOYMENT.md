# 🚀 Vercel 部署指南

## 📦 项目架构

```
你的项目（Vercel 一键部署）
├── frontend/               ← React 前端（自动部署到 Vercel CDN）
│   ├── src/
│   ├── dist/              ← 构建产物
│   └── api/               ← Vercel Serverless Functions（后端逻辑）
│       ├── search-work.ts
│       ├── disambiguate-work.ts
│       └── scrape-work-info.ts
└── vercel.json            ← Vercel 配置文件
```

**优点**：
- ✅ 前端 + 后端一起部署，无需单独配置
- ✅ 同域名，无跨域问题
- ✅ API Keys 安全（环境变量）
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 免费额度充足（每月 100GB 流量 + 100K Serverless 调用）

---

## 🚀 方式 A：一键部署（推荐）

### 1. 连接 GitHub

1. 把代码推送到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/APD.git
   git push -u origin main
   ```

2. 访问 Vercel：https://vercel.com/new

3. 点击 **Import Git Repository**

4. 选择你的 GitHub 仓库

### 2. 配置环境变量

在 Vercel 部署页面，添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `VITE_SUPABASE_URL` | `https://nypyccgkrxrvujavplrc.supabase.co` | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase 匿名密钥 |
| `SUPABASE_URL` | `https://nypyccgkrxrvujavplrc.supabase.co` | 后端用（同上） |
| `SUPABASE_SERVICE_ROLE_KEY` | （在 Supabase Dashboard 获取） | Supabase 服务端密钥 |
| `FIRECRAWL_API_KEY` | `fc-7cf8f9100771484db2a48d05f2d6f2b3` | Firecrawl API Key |
| `DEEPSEEK_API_KEY` | `sk-e3691fab10fb41058d6ba0d4cef03115` | DeepSeek API Key |

**如何获取 `SUPABASE_SERVICE_ROLE_KEY`**：
1. 访问 Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc/settings/api
   ```
2. 找到 **Service Role Key**（以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` 开头）
3. 复制并粘贴到 Vercel 环境变量

### 3. 部署

点击 **Deploy**，等待 1-2 分钟。

部署成功后，你会得到一个地址，例如：
```
https://apd.vercel.app
```

✅ **完成！**前端和后端全部部署好了！

---

## 🚀 方式 B：Vercel CLI 部署

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 部署项目

```bash
# 在项目根目录运行
vercel

# 首次部署会询问：
# Set up and deploy "~/APD"? [Y/n] → 输入 Y
# Which scope do you want to deploy to? → 选择你的账号
# Link to existing project? [y/N] → 输入 N
# What's your project's name? → 输入 apd 或任意名称
# In which directory is your code located? → 输入 ./
```

### 4. 配置环境变量

```bash
# 添加环境变量（Production）
vercel env add VITE_SUPABASE_URL
# 粘贴: https://nypyccgkrxrvujavplrc.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# 粘贴你的 Anon Key

vercel env add SUPABASE_URL
# 粘贴: https://nypyccgkrxrvujavplrc.supabase.co

vercel env add SUPABASE_SERVICE_ROLE_KEY
# 粘贴你的 Service Role Key

vercel env add FIRECRAWL_API_KEY
# 粘贴: fc-7cf8f9100771484db2a48d05f2d6f2b3

vercel env add DEEPSEEK_API_KEY
# 粘贴: sk-e3691fab10fb41058d6ba0d4cef03115
```

### 5. 重新部署

```bash
vercel --prod
```

---

## 🧪 本地测试 Vercel Functions

在部署前，你可以在本地测试 Vercel Serverless Functions：

```bash
# 1. 安装依赖
cd frontend
npm install

# 2. 创建本地 .env 文件
# frontend/.env
VITE_SUPABASE_URL=https://nypyccgkrxrvujavplrc.supabase.co
VITE_SUPABASE_ANON_KEY=你的Anon Key
SUPABASE_URL=https://nypyccgkrxrvujavplrc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的Service Role Key
FIRECRAWL_API_KEY=fc-7cf8f9100771484db2a48d05f2d6f2b3
DEEPSEEK_API_KEY=sk-e3691fab10fb41058d6ba0d4cef03115

# 3. 运行 Vercel Dev（模拟生产环境）
vercel dev
```

访问 `http://localhost:3000`，测试搜索功能。

---

## 📂 文件说明

### `vercel.json` - Vercel 配置文件

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "functions": {
    "frontend/api/**/*.ts": {
      "runtime": "nodejs20.x",
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/frontend/api/:path*"
    }
  ]
}
```

**说明**：
- `buildCommand`: 构建前端（Vite）
- `outputDirectory`: 前端输出目录
- `functions`: API Routes 配置（最长运行 60 秒）
- `rewrites`: URL 重写（`/api/*` → `/frontend/api/*`）

### `frontend/api/*.ts` - Vercel Serverless Functions

这些文件会自动部署为 Serverless Functions：

- `frontend/api/search-work.ts` → `https://你的域名/api/search-work`
- `frontend/api/disambiguate-work.ts` → `https://你的域名/api/disambiguate-work`
- `frontend/api/scrape-work-info.ts` → `https://你的域名/api/scrape-work-info`

---

## 🔄 更新部署

### 如果使用 GitHub 集成

推送代码到 GitHub，Vercel 会自动重新部署：

```bash
git add .
git commit -m "Update search feature"
git push
```

### 如果使用 Vercel CLI

```bash
vercel --prod
```

---

## 🔍 查看日志

### 在 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Logs** 查看实时日志

### 使用 CLI

```bash
# 查看最近的日志
vercel logs

# 实时跟踪日志
vercel logs --follow
```

---

## ⚠️ 常见问题

### Q1: 部署后 API 调用 404

**原因**: `vercel.json` 配置错误或路径不匹配

**解决**:
1. 确认 `vercel.json` 存在于项目根目录
2. 确认 API 文件在 `frontend/api/` 目录
3. 重新部署：`vercel --prod`

### Q2: 环境变量未生效

**原因**: 环境变量未添加或未重新部署

**解决**:
1. 在 Vercel Dashboard → Settings → Environment Variables 检查
2. 重新部署：`vercel --prod`

### Q3: API 调用超时

**原因**: Firecrawl 抓取耗时较长（默认 10 秒超时）

**解决**: 已在 `vercel.json` 中设置 `maxDuration: 60`（60 秒）

### Q4: CORS 错误

**原因**: API Routes 未正确配置 CORS

**解决**: 已在每个 API 文件中添加 CORS headers，应该没问题。

---

## 💰 费用说明

### Vercel 免费额度（Hobby Plan）

- ✅ **带宽**: 100GB/月
- ✅ **Serverless Functions**: 100K 次调用/月
- ✅ **构建时间**: 6000 分钟/月
- ✅ **自定义域名**: 支持

### 预估使用量

- **每次搜索**:
  - 3 个 API 调用（search + disambiguate + scrape）
  - 约 10-30 秒处理时间
  - 约 2-5MB 流量

- **每月可支持**:
  - 约 30,000 次搜索（免费额度内）
  - 完全够用！

---

## 🎯 自定义域名（可选）

### 1. 在 Vercel Dashboard

1. 进入项目 → Settings → Domains
2. 添加你的域名（例如：`apd.example.com`）
3. 按照提示配置 DNS 记录

### 2. DNS 配置

在你的域名提供商处添加：

```
类型: CNAME
名称: apd
值: cname.vercel-dns.com
```

等待 DNS 生效（5-30 分钟）。

---

## ✅ 部署检查清单

在部署前，确认：

- [ ] ✅ `vercel.json` 已创建
- [ ] ✅ `frontend/api/` 目录下有 3 个 `.ts` 文件
- [ ] ✅ 所有环境变量已配置（6 个）
- [ ] ✅ Supabase Service Role Key 已获取
- [ ] ✅ 代码已推送到 GitHub（如果用 Git 集成）

---

## 🎉 完成！

现在你的 ACGN 人格数据库已经成功部署到 Vercel 了！

**架构总结**：
- ✅ 前端（React + Vite）→ Vercel CDN
- ✅ 后端（Serverless Functions）→ Vercel Edge
- ✅ 数据库 → Supabase PostgreSQL
- ✅ 第三方 API → Firecrawl + DeepSeek

**访问地址**：
- 生产环境：`https://你的项目.vercel.app`
- 自定义域名：`https://你的域名.com`

**功能完整**：
- ✅ 用户认证（Supabase Auth）
- ✅ 搜索作品（数据库 + AI 消歧）
- ✅ 自动抓取（Firecrawl）
- ✅ 角色提取（DeepSeek）
- ✅ 投票系统
- ✅ 评论系统

Enjoy! 🚀

