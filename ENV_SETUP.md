# 🔐 环境变量配置指南

## 📝 配置步骤

### 1. 创建前端环境变量文件

在 `frontend` 目录下创建 `.env` 文件：

```bash
cd frontend
```

**Windows (PowerShell):**
```powershell
New-Item -Path .env -ItemType File -Force
```

**Mac/Linux:**
```bash
touch .env
```

### 2. 编辑 `.env` 文件

用文本编辑器打开 `frontend/.env`，添加以下内容：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://nypyccgkrxrvujavplrc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cHljY2drcnhydnVqYXZwbHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDIyOTUsImV4cCI6MjA4MDMxODI5NX0.eOENHTqEJyBK2pbqdXikiR_s8sZaaEQlI2zENOC_kK0
```

### 3. 配置 Supabase Secrets (后端 API Keys)

⚠️ **重要**: Firecrawl 和 DeepSeek 的 API Keys **不能**放在前端 `.env` 文件中！

这些 API Keys 只能在 Supabase Edge Functions 中使用（服务端），有两种配置方式：

#### 方式 A: 通过 Supabase Dashboard（推荐）

1. 访问 Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc/settings/functions
   ```

2. 找到 **Edge Functions** → **Secrets** 部分

3. 点击 **Add Secret**，添加以下两个密钥：

   ```
   名称: FIRECRAWL_API_KEY
   值: fc-7cf8f9100771484db2a48d05f2d6f2b3
   ```

   ```
   名称: DEEPSEEK_API_KEY
   值: sk-e3691fab10fb41058d6ba0d4cef03115
   ```

4. 保存后，重新部署 Edge Functions：
   ```bash
   supabase functions deploy disambiguate-work
   supabase functions deploy scrape-work-info
   ```

#### 方式 B: 通过 Supabase CLI

```bash
# 配置 Firecrawl API Key
supabase secrets set FIRECRAWL_API_KEY=fc-7cf8f9100771484db2a48d05f2d6f2b3

# 配置 DeepSeek API Key
supabase secrets set DEEPSEEK_API_KEY=sk-e3691fab10fb41058d6ba0d4cef03115

# 查看已配置的 secrets（不会显示值，只显示名称）
supabase secrets list
```

---

## 🔍 环境变量说明

### 前端环境变量 (frontend/.env)

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | ✅ 是 |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥（公开密钥） | ✅ 是 |

**注意**: 
- 前端环境变量以 `VITE_` 开头（Vite 要求）
- 这些变量会被打包到前端代码中，是**公开可见**的
- `ANON_KEY` 只有有限的权限，通过 RLS（Row Level Security）保护数据

### 后端环境变量 (Supabase Secrets)

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `FIRECRAWL_API_KEY` | Firecrawl API 密钥 | ✅ 是 |
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 | ✅ 是 |
| `SUPABASE_URL` | Supabase URL（自动注入） | ⚙️ 自动 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务端密钥（自动注入） | ⚙️ 自动 |

**注意**:
- 这些变量只在 Edge Functions 中可用
- **不会**暴露给前端用户
- `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 由 Supabase 自动注入

---

## ✅ 验证配置

### 1. 检查前端环境变量

创建一个测试文件 `frontend/test-env.js`:

```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置');
```

启动开发服务器：
```bash
cd frontend
npm run dev
```

打开浏览器控制台，应该看到：
```
VITE_SUPABASE_URL: https://nypyccgkrxrvujavplrc.supabase.co
VITE_SUPABASE_ANON_KEY: ✅ 已配置
```

### 2. 检查 Supabase Secrets

```bash
supabase secrets list
```

应该看到：
```
FIRECRAWL_API_KEY
DEEPSEEK_API_KEY
```

### 3. 测试 Edge Functions

```bash
# 测试 search-work
curl -X POST \
  https://nypyccgkrxrvujavplrc.supabase.co/functions/v1/search-work \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

如果配置正确，应该返回 JSON 响应（不是错误）。

---

## 🚨 常见问题

### Q1: 前端显示 "Missing Supabase environment variables"

**原因**: `.env` 文件未创建或变量名错误

**解决**:
1. 确认 `frontend/.env` 文件存在
2. 确认变量名以 `VITE_` 开头
3. 重启开发服务器：
   ```bash
   # 按 Ctrl+C 停止服务器
   npm run dev
   ```

### Q2: Edge Function 调用失败，返回 401 或 403

**原因**: Supabase URL 或 Anon Key 配置错误

**解决**:
1. 检查 `.env` 文件中的 URL 和 Key 是否正确
2. 确认 URL 末尾没有多余的斜杠 `/`
3. 确认 Key 完整复制（没有截断）

### Q3: Edge Function 报错 "DEEPSEEK_API_KEY not configured"

**原因**: Supabase Secrets 未配置或未部署

**解决**:
1. 确认已在 Supabase Dashboard 配置 Secrets
2. 重新部署 Edge Functions：
   ```bash
   supabase functions deploy disambiguate-work
   supabase functions deploy scrape-work-info
   ```
3. 等待 1-2 分钟让部署生效

### Q4: Firecrawl 抓取失败

**原因**: 
- API Key 无效
- 配额用完
- 网络问题

**解决**:
1. 访问 Firecrawl Dashboard 检查配额：
   ```
   https://firecrawl.dev/dashboard
   ```
2. 确认 API Key 正确：
   ```bash
   supabase secrets list
   # 应该看到 FIRECRAWL_API_KEY
   ```
3. 查看 Edge Function 日志：
   ```bash
   supabase functions logs scrape-work-info
   ```

---

## 🔒 安全最佳实践

### ✅ 正确做法

- ✅ API Keys 存储在 Supabase Secrets 中
- ✅ 前端只使用 `ANON_KEY`（有限权限）
- ✅ `.env` 文件添加到 `.gitignore`
- ✅ 使用环境变量，不硬编码敏感信息

### ❌ 错误做法

- ❌ 把 API Keys 放在前端代码中
- ❌ 把 `.env` 文件提交到 Git
- ❌ 使用 `SERVICE_ROLE_KEY` 在前端
- ❌ 在公开的地方分享 API Keys

---

## 📚 相关文档

- [Supabase 环境变量文档](https://supabase.com/docs/guides/cli/managing-environments)
- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [Firecrawl API 文档](https://docs.firecrawl.dev/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)

---

## ✨ 完成！

环境变量配置完成后，你就可以：

1. ✅ 启动开发服务器
2. ✅ 使用搜索功能
3. ✅ 调用 Firecrawl 和 DeepSeek API
4. ✅ 安全地管理敏感信息

如有问题，请查看 `SEARCH_FEATURE_SETUP.md` 获取详细的功能说明。

