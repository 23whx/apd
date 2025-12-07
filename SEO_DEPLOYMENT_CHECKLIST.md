# ✅ SEO 部署检查清单

部署后请按以下步骤验证 SEO 配置是否正确：

## 🔍 立即验证

### 1. **检查基础配置**
打开浏览器访问 https://apd-eight.vercel.app/

按 `Ctrl+U` (Windows) 或 `Cmd+Option+U` (Mac) 查看源代码，确认：

- [ ] `<html lang="en">` (主语言为英文)
- [ ] `<title>` 包含 "ACGN Personality Database"
- [ ] `<meta name="description">` 为英文描述
- [ ] `<meta property="og:locale" content="en_US">` 存在
- [ ] Google AdSense 脚本已加载

### 2. **检查 robots.txt**
访问：https://apd-eight.vercel.app/robots.txt

确认显示：
```
User-agent: *
Allow: /
...
Sitemap: https://apd-eight.vercel.app/sitemap.xml
```

### 3. **检查 sitemap.xml**
访问：https://apd-eight.vercel.app/sitemap.xml

确认显示完整的 XML sitemap，包含：
- 首页 (/)
- 作品页 (/works)
- 角色页 (/characters)
- 其他页面

### 4. **检查结构化数据**
打开首页 → 按 `F12` 打开开发者工具 → Elements 标签

在 `<head>` 中查找：
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  ...
}
</script>
```

应该有**两个** `application/ld+json` 脚本：
- [ ] Website Schema
- [ ] Organization Schema

---

## 🔧 Google Search Console 设置

### 5. **添加网站**
1. 访问 https://search.google.com/search-console
2. 点击 "添加资源"
3. 输入：`https://apd-eight.vercel.app`
4. 选择验证方式（推荐使用 HTML 标签验证）

### 6. **提交 Sitemap**
在 Google Search Console:
1. 左侧菜单 → "Sitemaps"
2. 输入：`sitemap.xml`
3. 点击 "提交"
4. 等待 Google 抓取（通常 1-7 天）

### 7. **请求索引（可选，加快收录）**
在 Google Search Console:
1. 顶部搜索框输入：`https://apd-eight.vercel.app/`
2. 点击 "请求索引"
3. 对以下页面重复操作：
   - `/works`
   - `/characters`
   - `/about`

---

## 🧪 在线 SEO 工具验证

### 8. **Rich Results Test**
访问：https://search.google.com/test/rich-results

1. 输入：`https://apd-eight.vercel.app/`
2. 点击 "测试 URL"
3. 确认显示 "Website" 和 "Organization" 结构化数据

**预期结果**：
```
✅ Valid structured data
   - WebSite
   - Organization
```

### 9. **PageSpeed Insights**
访问：https://pagespeed.web.dev/

1. 输入：`https://apd-eight.vercel.app/`
2. 点击 "Analyze"
3. 查看性能评分

**目标**：
- 移动端：> 70 分
- 桌面端：> 90 分

### 10. **Mobile-Friendly Test**
访问：https://search.google.com/test/mobile-friendly

1. 输入：`https://apd-eight.vercel.app/`
2. 确认显示 "Page is mobile-friendly"

---

## 📊 Bing Webmaster Tools 设置

### 11. **添加网站到 Bing**
1. 访问 https://www.bing.com/webmasters
2. 添加网站：`https://apd-eight.vercel.app`
3. 验证所有权
4. 提交 sitemap：`https://apd-eight.vercel.app/sitemap.xml`

---

## 🌐 多语言验证

### 12. **测试语言切换**
1. 访问首页
2. 点击右上角语言按钮 (🌐)
3. 切换到中文 → 确认页面内容变为中文
4. 切换到日语 → 确认页面内容变为日语
5. 切换到英语 → 确认页面内容变为英语

### 13. **检查 hreflang 标签**
查看源代码，确认每个页面都有：
```html
<link rel="alternate" hreflang="en" href="..." />
<link rel="alternate" hreflang="zh" href="..." />
<link rel="alternate" hreflang="ja" href="..." />
<link rel="alternate" hreflang="x-default" href="..." />
```

---

## 🔗 社交媒体分享测试

### 14. **Facebook Sharing Debugger**
访问：https://developers.facebook.com/tools/debug/

1. 输入：`https://apd-eight.vercel.app/`
2. 点击 "Debug"
3. 确认显示正确的标题、描述、图片

### 15. **Twitter Card Validator**
访问：https://cards-dev.twitter.com/validator

1. 输入：`https://apd-eight.vercel.app/`
2. 确认显示 "Card preview" 和正确的元数据

---

## 📈 监控设置

### 16. **Google Analytics（如果已配置）**
1. 确认跟踪代码已安装
2. 访问几个页面
3. 在 GA 实时报告中确认有数据

### 17. **设置监控提醒**
- [ ] Google Search Console 邮件通知已开启
- [ ] Vercel 部署通知已开启
- [ ] Uptime 监控（如 UptimeRobot）已配置

---

## 🎯 第一周 SEO 任务

### 18. **内容优化**
- [ ] 为前 10 个热门作品添加详细描述
- [ ] 为前 20 个热门角色添加详细描述
- [ ] 确保每个页面有唯一的 meta description

### 19. **外部推广**
- [ ] 在 Twitter 发布网站上线公告
- [ ] 在相关 Reddit 社区分享（r/anime, r/mbti）
- [ ] 在个人社交媒体分享

### 20. **技术优化**
- [ ] 检查所有图片都有 alt 标签
- [ ] 确保所有链接可正常访问（无 404）
- [ ] 压缩大图片，提升加载速度

---

## 📝 SEO 数据记录

部署日期：____________

| 检查项 | 状态 | 备注 |
|--------|------|------|
| robots.txt | ⬜ |  |
| sitemap.xml | ⬜ |  |
| Schema.org | ⬜ |  |
| Google Search Console | ⬜ |  |
| Bing Webmaster | ⬜ |  |
| Mobile-Friendly | ⬜ |  |
| Rich Results | ⬜ |  |
| PageSpeed Score | ⬜ | 分数: ____ |
| Twitter Card | ⬜ |  |
| OG Tags | ⬜ |  |

---

## 🚨 常见问题

### Q: Sitemap 显示 404？
**A**: 确保 `frontend/public/sitemap.xml` 文件存在，Vercel 会自动部署 `public` 目录下的静态文件。

### Q: Schema.org 不显示？
**A**: 打开开发者工具 → Console，查看是否有 JavaScript 错误。确保 `injectSchema` 函数在 `useEffect` 中正确调用。

### Q: Google 多久能收录我的网站？
**A**: 通常 1-4 周。提交 sitemap 和手动请求索引可以加快速度。

### Q: 如何查看当前索引状态？
**A**: 在 Google 搜索：`site:apd-eight.vercel.app`，会显示已索引的页面数量。

---

**完成以上所有检查后，你的 SEO 优化就部署完成了！** 🎉

定期检查 Google Search Console 的"效果"报告，持续优化关键词和内容。

