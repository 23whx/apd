# OAuth 登录配置指南

## ✅ 已完成的代码更新

前端代码已经更新完成，包括：
- ✅ Google OAuth 登录按钮
- ✅ GitHub OAuth 登录按钮
- ✅ OAuth 回调页面 (`/auth/callback`)
- ✅ AuthContext 集成 Google 和 GitHub 登录方法

## 🔧 Supabase 后台配置

### 1. Google OAuth 配置（已启用 ✓）

从截图看，Google 已经启用。如果需要重新配置：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建或选择项目
3. 启用 **Google+ API**
4. 创建 OAuth 2.0 客户端 ID：
   - **应用类型**：Web 应用
   - **授权重定向 URI**：
     ```
     https://nypyccgkrxrvujavplrc.supabase.co/auth/v1/callback
     ```
5. 复制 **客户端 ID** 和 **客户端密钥**
6. 在 Supabase Dashboard → Authentication → Providers → Google：
   - 启用 Google
   - 粘贴客户端 ID 和密钥
   - 保存

### 2. GitHub OAuth 配置（已启用 ✓）

从截图看，GitHub 已经启用。如果需要重新配置：

1. 访问 [GitHub Settings](https://github.com/settings/developers)
2. 点击 **OAuth Apps** → **New OAuth App**
3. 填写信息：
   - **Application name**: ACGN Personality Database
   - **Homepage URL**: `http://localhost:5173` (开发) 或你的生产域名
   - **Authorization callback URL**:
     ```
     https://nypyccgkrxrvujavplrc.supabase.co/auth/v1/callback
     ```
4. 创建后，复制 **Client ID** 和生成 **Client Secret**
5. 在 Supabase Dashboard → Authentication → Providers → GitHub：
   - 启用 GitHub
   - 粘贴 Client ID 和 Secret
   - 保存

## 🧪 本地开发测试

### 重要：本地开发的重定向配置

在 Supabase Dashboard → Authentication → URL Configuration 中添加：

**Redirect URLs**（Site URL 下方）：
```
http://localhost:5173/auth/callback
http://localhost:5173
```

### 测试步骤

1. **启动开发服务器**：
   ```bash
   cd frontend
   npm run dev
   ```

2. **访问应用**：
   ```
   http://localhost:5173/
   ```

3. **测试 Google 登录**：
   - 点击右上角「登录」
   - 点击「Continue with Google」
   - 选择 Google 账号
   - 应该重定向回首页并显示已登录状态

4. **测试 GitHub 登录**：
   - 点击右上角「登录」
   - 点击「Continue with GitHub」
   - 授权 GitHub 应用
   - 应该重定向回首页并显示已登录状态

## 🚀 生产环境部署

部署到 Vercel 等平台后，需要在 Supabase 中添加生产域名：

**Redirect URLs**：
```
https://your-domain.com/auth/callback
https://your-domain.com
```

同时在 Google Cloud 和 GitHub OAuth App 中也要添加生产环境的重定向 URI：
```
https://nypyccgkrxrvujavplrc.supabase.co/auth/v1/callback
```

## 📋 验证登录成功

登录成功后，在 Supabase Dashboard → Authentication → Users 中可以看到：
- 用户的邮箱
- 登录方式（google / github）
- 用户元数据

同时，`users` 表会通过触发器自动创建对应的用户记录。

## ⚠️ 常见问题

### 问题 1：OAuth 登录后白屏
**解决**：检查 Redirect URLs 配置，确保包含 `/auth/callback`

### 问题 2：GitHub 显示 "redirect_uri mismatch"
**解决**：检查 GitHub OAuth App 的 callback URL 是否正确：
```
https://nypyccgkrxrvujavplrc.supabase.co/auth/v1/callback
```

### 问题 3：Google 登录显示 "error 400: redirect_uri_mismatch"
**解决**：在 Google Cloud Console 中添加完整的回调 URL

### 问题 4：本地开发 OAuth 不工作
**解决**：确保 Supabase Site URL 配置为 `http://localhost:5173`

## 🎉 完成！

现在用户可以通过以下方式登录：
- ✅ 邮箱 + 密码
- ✅ Google 账号
- ✅ GitHub 账号

所有方式都会自动在 `users` 表创建用户记录！

