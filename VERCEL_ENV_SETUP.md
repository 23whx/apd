# Vercel 环境变量配置指南

## 🚨 当前问题

部署后的网站无法连接到 Supabase，因为环境变量未设置。

## ✅ 解决方案

### 1. 登录 Vercel Dashboard
访问：https://vercel.com/dashboard

### 2. 进入项目设置
1. 选择你的项目：`APD` 或 `apd-eight`
2. 点击 `Settings` 标签
3. 点击左侧菜单的 `Environment Variables`

### 3. 添加以下环境变量

#### **VITE_SUPABASE_URL**
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://你的项目.supabase.co`
- **Environment**: 选择 `Production`, `Preview`, `Development` 全选

#### **VITE_SUPABASE_ANON_KEY**
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: 你的 Supabase Anon Key（从 Supabase Dashboard → Settings → API 获取）
- **Environment**: 选择 `Production`, `Preview`, `Development` 全选

### 4. 重新部署

添加环境变量后，需要重新部署：

#### 方法 1：在 Vercel Dashboard
1. 进入 `Deployments` 标签
2. 点击最新部署右侧的 `...` 菜单
3. 选择 `Redeploy`

#### 方法 2：使用命令行
```bash
# 在本地项目目录执行
vercel --prod
```

#### 方法 3：推送代码触发自动部署
```bash
git add .
git commit -m "Update environment variables"
git push origin main
```

## 📋 获取 Supabase 凭据

1. 访问：https://supabase.com/dashboard
2. 选择你的项目
3. 点击左侧的齿轮图标 ⚙️ (Settings)
4. 点击 `API`
5. 复制以下信息：
   - **Project URL** → 这是 `VITE_SUPABASE_URL`
   - **anon public** → 这是 `VITE_SUPABASE_ANON_KEY`

## 🔍 验证环境变量

部署完成后，打开浏览器控制台（F12），应该看到：
- ✅ 不再有 `example.supabase.co` 的错误
- ✅ 能看到热门作品列表
- ✅ 可以正常登录

## ⚠️ 注意事项

1. **环境变量必须以 `VITE_` 开头**
   - Vite 只会将以 `VITE_` 开头的变量打包到前端代码中
   
2. **修改后必须重新部署**
   - 环境变量不会自动生效
   - 必须触发新的构建和部署

3. **不要将敏感信息提交到 Git**
   - `.env` 文件应该在 `.gitignore` 中
   - 只在 Vercel Dashboard 中设置环境变量

## 🔐 Google OAuth 配置

如果 Google 登录也失败，还需要在 Supabase 中添加 Vercel 部署域名：

1. Supabase Dashboard → Authentication → URL Configuration
2. 在 **Site URL** 中设置：`https://apd-eight.vercel.app`
3. 在 **Redirect URLs** 中添加：`https://apd-eight.vercel.app/auth/callback`
4. 保存设置

完成以上步骤后，网站就能正常工作了！

