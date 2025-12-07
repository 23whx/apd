# 🌐 域名迁移指南：acgn-personality-database.top

从 `apd-eight.vercel.app` 迁移到 `acgn-personality-database.top`

---

## ✅ 已完成的代码修改

### 1. **前端代码** (已自动更新)
- ✅ `frontend/index.html` - Meta 标签、Canonical URL
- ✅ `frontend/public/robots.txt` - Sitemap URL
- ✅ `frontend/public/sitemap.xml` - 所有页面 URL
- ✅ `frontend/src/lib/schema.ts` - Schema.org 结构化数据

---

## 🔧 需要手动配置的部分

### **步骤 1: Supabase Authentication** ⭐ 最重要！

访问：https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc/auth/url-configuration

#### **Site URL** (修改为)
```
https://acgn-personality-database.top
```

#### **Redirect URLs** (添加以下所有 URL)
```
✅ https://acgn-personality-database.top/auth/callback
✅ https://acgn-personality-database.top/*
✅ https://www.acgn-personality-database.top/auth/callback
✅ https://www.acgn-personality-database.top/*
✅ https://apd-eight.vercel.app/auth/callback  (保留作为备用)
✅ https://apd-eight.vercel.app/*
✅ http://localhost:5173/auth/callback  (本地开发)
```

**截图示例**：(参考你上传的图片配置方式)

**为什么需要同时添加 www 和非 www？**
- 用户可能通过两种方式访问：`acgn-personality-database.top` 或 `www.acgn-personality-database.top`
- Google/GitHub OAuth 回调时需要精确匹配 URL
- 两者都配置可以确保任何情况下登录都能正常工作

---

### **步骤 2: Vercel 域名配置**

#### 2.1 添加自定义域名
1. 访问 Vercel Dashboard: https://vercel.com/dashboard
2. 选择你的项目（APD）
3. **Settings** → **Domains**
4. 点击 **Add Domain**

添加以下两个域名：
```
1. acgn-personality-database.top  (根域名)
2. www.acgn-personality-database.top  (www 子域名)
```

#### 2.2 DNS 配置
在你的域名注册商（阿里云、腾讯云、Cloudflare、GoDaddy 等）添加以下 DNS 记录：

**A 记录（根域名）**：
```
类型:  A
名称:  @  或留空
值:    76.76.21.21
TTL:   自动 (或 600)
```

**CNAME 记录（www 子域名）**：
```
类型:  CNAME
名称:  www
值:    cname.vercel-dns.com
TTL:   自动 (或 600)
```

#### 2.3 等待 DNS 生效
- 通常需要 **5-30 分钟**
- 最长可能需要 **24 小时**
- 可以使用 https://dnschecker.org/ 检查 DNS 是否全球生效

#### 2.4 配置 www 重定向（可选）
在 Vercel **Domains** 设置中：
- 将 `www.acgn-personality-database.top` 设置为重定向到 `acgn-personality-database.top`
- 或反之，根据你的偏好

**推荐**：将 www 重定向到非 www（更简洁）

---

### **步骤 3: Google OAuth 设置（如果使用）**

如果你在 Google Cloud Console 单独配置了 OAuth：

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择你的项目
3. **APIs & Services** → **Credentials**
4. 找到你的 OAuth 2.0 Client ID
5. 在 **Authorized redirect URIs** 中添加：

```
https://nypyccgkrxrvujavplrc.supabase.co/auth/v1/callback
https://acgn-personality-database.top/auth/callback
https://www.acgn-personality-database.top/auth/callback
```

6. 点击 **Save**

**注意**：通常只需要 Supabase 的回调 URL，前端的可选。

---

### **步骤 4: GitHub OAuth 设置（如果使用）**

1. 访问 [GitHub Settings](https://github.com/settings/developers)
2. 选择你的 OAuth App
3. 更新 **Authorization callback URL**:

```
https://nypyccgkrxrvujavplrc.supabase.co/auth/v1/callback
```

4. 点击 **Update application**

---

### **步骤 5: 部署到 Vercel**

在项目根目录运行：

```bash
cd frontend
npm run build
```

然后 push 到 GitHub，Vercel 会自动部署，或者手动部署：

```bash
vercel --prod
```

---

### **步骤 6: Google Search Console 更新**

#### 6.1 添加新域名
1. 访问 https://search.google.com/search-console
2. 点击 "添加资源"
3. 输入：`https://acgn-personality-database.top`
4. 验证所有权（推荐 HTML 标签验证）

#### 6.2 提交新 Sitemap
在 Google Search Console:
1. 左侧菜单 → "Sitemaps"
2. 输入：`sitemap.xml`
3. 点击 "提交"

#### 6.3 设置域名更改（可选）
如果旧域名已被索引：
1. 在旧域名的 Search Console 中
2. **设置** → **Change of Address**
3. 选择新域名：`acgn-personality-database.top`
4. 这会告诉 Google 将旧域名的 SEO 权重转移到新域名

---

### **步骤 7: Bing Webmaster Tools 更新**

1. 访问 https://www.bing.com/webmasters
2. 添加网站：`https://acgn-personality-database.top`
3. 验证所有权
4. 提交 sitemap：`https://acgn-personality-database.top/sitemap.xml`

---

## 🧪 验证清单

部署后请逐一验证：

### ✅ 基础访问
- [ ] https://acgn-personality-database.top 能正常访问
- [ ] https://www.acgn-personality-database.top 能正常访问（或正确重定向）
- [ ] HTTPS 证书有效（绿色锁标志）

### ✅ 静态文件
- [ ] https://acgn-personality-database.top/robots.txt 显示正确内容
- [ ] https://acgn-personality-database.top/sitemap.xml 显示正确内容
- [ ] Sitemap 中所有 URL 都指向新域名

### ✅ SEO Meta 标签
访问首页，按 `Ctrl+U` 查看源代码：
- [ ] `<link rel="canonical" href="https://acgn-personality-database.top/" />`
- [ ] `<meta property="og:url" content="https://acgn-personality-database.top/" />`
- [ ] 所有 `<link rel="alternate" hreflang="..." href="https://acgn-personality-database.top/..." />`

### ✅ 结构化数据
按 `F12` → Elements → `<head>` 中查找：
- [ ] Schema.org 中的 `url` 字段为新域名
- [ ] `potentialAction.target` 指向新域名

### ✅ 用户登录功能
- [ ] Google 登录正常工作
- [ ] GitHub 登录正常工作（如果配置）
- [ ] 登录后能正确跳转回首页
- [ ] 退出登录正常

### ✅ 多语言功能
- [ ] 从中国 IP 访问 → 自动显示中文
- [ ] 从日本 IP 访问 → 自动显示日语
- [ ] 从其他地区访问 → 默认显示英语
- [ ] 手动切换语言正常

---

## 🔄 301 重定向设置（可选，推荐）

为了保留旧域名的 SEO 权重，建议设置 301 永久重定向：

### 方法 1: Vercel 配置文件

创建或修改 `vercel.json`：

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://acgn-personality-database.top/:path*",
      "permanent": true,
      "has": [
        {
          "type": "host",
          "value": "apd-eight.vercel.app"
        }
      ]
    }
  ]
}
```

这会将所有访问 `apd-eight.vercel.app` 的请求自动重定向到新域名。

### 方法 2: Vercel Dashboard
1. **Settings** → **Redirects**
2. 添加规则：
   ```
   Source: apd-eight.vercel.app/*
   Destination: https://acgn-personality-database.top/$1
   Permanent: Yes (301)
   ```

---

## 📊 预期时间表

| 任务 | 预计时间 | 说明 |
|------|---------|------|
| **DNS 生效** | 5-30 分钟 | 最长 24 小时 |
| **Vercel 部署** | 2-5 分钟 | 自动部署 |
| **HTTPS 证书** | 自动 | Vercel 自动颁发 |
| **Google 索引** | 1-4 周 | 提交 sitemap 加快 |
| **SEO 权重转移** | 2-6 个月 | 如果使用 301 重定向 |

---

## ❓ 常见问题

### Q1: 域名配置后显示 404？
**A**: 检查：
1. DNS 是否生效（使用 `nslookup acgn-personality-database.top`）
2. Vercel 是否成功添加域名
3. 是否重新部署了代码

### Q2: Google 登录失败，显示 "redirect_uri_mismatch"？
**A**: 
1. 确认 Supabase **Redirect URLs** 中已添加新域名
2. 确认拼写完全正确（区分大小写）
3. 包括 `/auth/callback` 路径
4. 清除浏览器缓存后重试

### Q3: www 和非 www 应该用哪个？
**A**: 
- **推荐**：使用非 www（`acgn-personality-database.top`）更简洁
- 将 `www.acgn-personality-database.top` 301 重定向到主域名
- 两者都要在 Supabase 配置，以防用户直接访问

### Q4: 旧域名 apd-eight.vercel.app 还能用吗？
**A**: 
- 可以继续使用，但建议设置 301 重定向到新域名
- Supabase 配置中保留旧域名 URL，以防部分用户收藏了旧链接
- SEO 方面，Google 会逐渐将权重转移到新域名

### Q5: 需要更新 Google AdSense 配置吗？
**A**: 
- 是的，在 Google AdSense 后台添加新域名：`acgn-personality-database.top`
- 保留旧域名，直到确认新域名广告正常显示

---

## 📞 需要帮助？

如果遇到问题：
1. 检查浏览器控制台 (F12) 的错误信息
2. 查看 Vercel 部署日志
3. 联系：wanghongxiang23@gmail.com

---

**祝迁移顺利！** 🎉

新域名 `acgn-personality-database.top` 更专业、更易记，对 SEO 有很大帮助！

