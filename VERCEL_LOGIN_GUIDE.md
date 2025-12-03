# 🚀 Vercel Dev 完整启动指南

## 📋 操作步骤

### 1️⃣ 打开终端

在 VS Code 中按 `` Ctrl + ` `` 打开终端，或者使用 PowerShell。

### 2️⃣ 进入项目根目录

```powershell
cd D:\code\workspace\APD
```

### 3️⃣ 启动 Vercel Dev

```powershell
vercel dev
```

---

## 🔐 第一次运行：登录认证

你会看到这样的输出：

```
Vercel CLI 48.12.1
> No existing credentials found. Please log in:

  Visit https://vercel.com/oauth/device?user_code=XXXX-XXXX
  Press [ENTER] to open the browser
| Waiting for authentication...
```

### ✅ 完成认证（3 步）

#### 步骤 1：按回车键

在终端按 `[ENTER]`，会自动打开浏览器。

#### 步骤 2：选择登录方式

在浏览器中，选择一种登录方式：

- **Continue with GitHub** （推荐，如果你有 GitHub 账号）
- **Continue with Google** （如果你有 Google 账号）
- **Continue with Email** （输入邮箱，然后去邮箱查收验证码）

#### 步骤 3：完成授权

登录后，点击 **"Authorize"** 或 **"Continue"** 授权 Vercel CLI。

---

## 🎯 第二步：配置项目

登录成功后，终端会显示：

```
✓ Authenticated

? Set up and deploy "D:\code\workspace\APD"? (Y/n)
```

**按 `Y` 然后回车**

---

然后会问几个问题：

### 问题 1：选择 Scope

```
? Which scope should contain your project?
```

**按回车**（选择你的账号）

### 问题 2：是否链接已有项目

```
? Link to existing project? (y/N)
```

**按 `N` 然后回车**（创建新项目）

### 问题 3：项目名称

```
? What's your project's name? (APD)
```

**直接回车**（使用默认名称 APD）

### 问题 4：代码所在目录

```
? In which directory is your code located? (./)
```

**直接回车**（使用默认 `./`）

---

## ✅ 启动成功！

配置完成后，你会看到：

```
🔗  Linked to username/apd (created .vercel)
🔍  Inspect: https://vercel.com/username/apd/...
✅  Preview: http://localhost:3000
```

**现在访问 http://localhost:3000 就可以了！**

---

## 🧪 测试搜索功能

1. 在浏览器打开 `http://localhost:3000`
2. 点击主页的 **"扫描"** 按钮
3. 输入作品名（例如：`新世纪福音战士`）
4. 观察完整流程：
   - ✅ 数据库搜索
   - ✅ AI 消歧
   - ✅ 网页抓取
   - ✅ 角色提取

---

## 🐛 常见问题

### Q1: 认证链接打不开

**解决**：手动复制链接到浏览器：
```
https://vercel.com/oauth/device?user_code=XXXX-XXXX
```

### Q2: 认证按钮全部灰色/禁用

**原因**：认证代码过期（5-10分钟失效）

**解决**：
1. 在终端按 `Ctrl + C` 停止
2. 重新运行 `vercel dev`
3. 立即完成认证

### Q3: 端口 3000 被占用

**解决**：
```powershell
# 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 结束进程（替换 PID）
taskkill /PID <PID> /F

# 或者使用其他端口
vercel dev --listen 3001
```

### Q4: 网页显示 404

**可能原因**：
- API 路由配置问题
- 环境变量未加载

**解决**：
1. 检查 `frontend/.env` 文件是否存在
2. 确认所有环境变量都已配置
3. 重启 `vercel dev`

### Q5: API 调用返回 500

**原因**：环境变量缺失或错误

**检查清单**：
```env
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY  ← 最重要！
✅ FIRECRAWL_API_KEY
✅ DEEPSEEK_API_KEY
```

---

## 🔄 日常开发流程

### 启动服务器

```powershell
cd D:\code\workspace\APD
vercel dev
```

### 修改代码

- **前端代码**：`frontend/src/**` - 自动热更新 ✅
- **API 代码**：`frontend/api/**` - 需要重启 ❌

### 查看日志

终端会实时显示：
- 页面访问日志
- API 调用日志
- 错误信息

### 停止服务器

按 `Ctrl + C`

---

## 📚 相关文档

- [LOCAL_TESTING.md](./LOCAL_TESTING.md) - 本地测试详细指南
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - 生产环境部署
- [ENV_SETUP.md](./ENV_SETUP.md) - 环境变量配置

---

## 💡 小贴士

1. **首次运行需要登录** - 只需要一次，之后会记住
2. **认证代码有时效** - 生成后立即完成认证
3. **配置保存在 `.vercel` 目录** - 不要删除
4. **环境变量从 `frontend/.env` 读取** - 确保已配置
5. **API 修改需要重启** - 前端修改不需要

---

**现在去终端运行 `vercel dev` 吧！** 🚀

按照上面的步骤一步步操作，遇到问题随时查看这个文档。

