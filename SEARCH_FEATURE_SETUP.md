# 🔍 ACGN 作品搜索功能说明

## 📋 功能概述

这个搜索功能实现了完整的 ACGN 作品自动采集流程：

1. **数据库模糊查询** - 先在本地数据库查找相似作品，减少 API 调用
2. **DeepSeek AI 消歧** - 使用 LLM 判断是否重复作品（考虑别名、翻译名等）
3. **Firecrawl 网页抓取** - 自动从以下来源抓取：
   - 萌娘百科 (zh.moegirl.org.cn)
   - 维基百科 (zh.wikipedia.org)
   - 百度百科 (baike.baidu.com)
4. **角色提取** - 使用 DeepSeek 从抓取内容中提取角色信息
5. **自动入库** - 创建作品和角色记录

---

## 🏗️ 架构说明

```
┌──────────────────────┐
│  React Frontend      │  ← Vercel CDN（全球加速）
│  (localhost:5173)    │
└──────────┬───────────┘
           │ 调用同域名 API（无跨域）
           ↓
┌──────────────────────┐
│ Vercel API Routes    │  ← Serverless Functions
│ /api/search-work     │     • 自动扩展
│ /api/disambiguate    │     • 按需计费
│ /api/scrape-info     │     • 全球部署
└──────────┬───────────┘
           │
           ├─→ Supabase PostgreSQL（数据库查询）
           ├─→ Firecrawl API（网页抓取）
           └─→ DeepSeek API（AI 消歧和提取）
```

**优点**：
- ✅ 前后端统一部署，一次搞定
- ✅ 同域名，无跨域问题
- ✅ API Keys 完全安全（服务端）
- ✅ 自动 HTTPS + 全球 CDN
- ✅ 免费额度充足

---

## 📊 数据流程图

```
用户输入作品名
    ↓
[前端] 发送请求到 /api/search-work
    ↓
[后端] 数据库模糊查询 (Postgres ILIKE)
    ├─ 找到相似 → 返回候选列表 → [前端] 显示
    │                              ↓
    │                         发送请求到 /api/disambiguate-work
    │                              ↓
    │                    [后端] DeepSeek AI 消歧
    │              ├─ 判定重复 → [前端] 提示用户
    │              └─ 判定新作 → 继续抓取
    └─ 未找到 → 直接进入抓取流程
                    ↓
        [前端] 发送请求到 /api/scrape-work-info
                    ↓
        [后端] 并行调用 Firecrawl 抓取 3 个来源
                    ↓
        [后端] 合并内容，调用 DeepSeek 提取角色
                    ↓
        [后端] 创建作品和角色记录到 Supabase
                    ↓
        [前端] 显示成功，跳转到作品页
                    ↓
                 完成 ✅
```

---

## 🌐 支持的数据来源

### 1. 萌娘百科 (zh.moegirl.org.cn)
- **优点**: ACGN 内容最全，角色信息详细，中文友好
- **格式**: `https://zh.moegirl.org.cn/作品名`
- **示例**: https://zh.moegirl.org.cn/新世纪福音战士

### 2. 维基百科 (zh.wikipedia.org)
- **优点**: 内容权威，多语言支持好
- **格式**: `https://zh.wikipedia.org/wiki/作品名`
- **示例**: https://zh.wikipedia.org/wiki/新世纪福音战士

### 3. 百度百科 (baike.baidu.com)
- **优点**: 中文内容丰富，图片质量高
- **格式**: `https://baike.baidu.com/item/作品名`
- **示例**: https://baike.baidu.com/item/新世纪福音战士

---

## 🚀 使用说明

### 前端使用

1. 点击主页的 **"扫描"** 按钮
2. 在弹出的搜索框中输入作品名（中/英/日文均可）
3. 点击 **"Search & Create"**
4. 等待处理（10-30 秒）：
   - ✅ 数据库搜索（1-2 秒）
   - ✅ AI 消歧（如果有相似作品，3-5 秒）
   - ✅ 网页抓取（10-20 秒）
   - ✅ 角色提取（5-10 秒）
5. 完成后自动跳转到作品详情页

### API 端点

#### 1. `/api/search-work` - 数据库模糊查询

**请求**:
```json
POST /api/search-work
{
  "query": "新世纪福音战士"
}
```

**响应**（找到相似作品）:
```json
{
  "found": true,
  "candidates": [
    {
      "id": "xxx-xxx-xxx",
      "name_cn": "新世纪福音战士",
      "name_en": "Neon Genesis Evangelion",
      "name_jp": "新世紀エヴァンゲリオン",
      "type": "anime"
    }
  ],
  "message": "Found similar works in database"
}
```

**响应**（未找到）:
```json
{
  "found": false,
  "message": "No similar works found, can proceed to LLM disambiguation"
}
```

#### 2. `/api/disambiguate-work` - AI 消歧

**请求**:
```json
POST /api/disambiguate-work
{
  "query": "EVA",
  "candidates": [
    {
      "id": "xxx",
      "name_cn": "新世纪福音战士",
      "name_en": "Evangelion",
      "type": "anime"
    }
  ]
}
```

**响应**:
```json
{
  "isDuplicate": true,
  "matchedWorkId": "xxx-xxx-xxx",
  "confidence": 0.95,
  "reason": "EVA 是新世纪福音战士的常用简称",
  "suggestedNames": {
    "name_cn": "新世纪福音战士",
    "name_en": "Neon Genesis Evangelion",
    "name_jp": "新世紀エヴァンゲリオン"
  },
  "type": "anime"
}
```

#### 3. `/api/scrape-work-info` - 抓取和提取

**请求**:
```json
POST /api/scrape-work-info
{
  "workName": "新世纪福音战士",
  "userId": "user-uuid"
}
```

**响应**:
```json
{
  "success": true,
  "work": {
    "id": "work-uuid",
    "name_cn": "新世纪福音战士",
    "name_en": "Neon Genesis Evangelion",
    "name_jp": "新世紀エヴァンゲリオン",
    "type": "anime",
    "summary_md": "科幻机战动画...",
    "source_urls": {
      "moegirl": "https://...",
      "wikipedia": "https://...",
      "baike": "https://..."
    }
  },
  "charactersCount": 12,
  "sources": ["moegirl", "wikipedia", "baike"]
}
```

---

## ⚙️ 配置参数

### Firecrawl 抓取参数

```typescript
{
  url: string,                    // 目标 URL
  formats: ['markdown', 'html'],  // 返回格式
  onlyMainContent: true,          // 只抓取主要内容
  waitFor: 2000                   // 等待 2 秒让动态内容加载
}
```

### DeepSeek 参数

```typescript
{
  model: 'deepseek-chat',   // 模型名称
  temperature: 0.2-0.3,     // 降低随机性，提高准确度
  max_tokens: 500-2000      // 根据任务调整
}
```

---

## 💰 成本估算

### Vercel Serverless Functions
- **免费额度**: 100K 次调用/月
- **每次搜索**: 3 次调用（search + disambiguate + scrape）
- **预估**: 约 30,000 次搜索/月（免费额度内）

### Firecrawl API
- **免费额度**: 500 次/月
- **付费**: $0.004/次（每千次 $4）
- **每次搜索**: 3 次调用（萌娘+维基+百度）
- **预估**: 约 150 次作品搜索/月（免费额度内）

### DeepSeek API
- **定价**: ¥0.001/1K tokens（极便宜）
- **消歧**: ~200 tokens/次
- **角色提取**: ~1000 tokens/次
- **预估**: 每次搜索约 ¥0.0012，1000 次搜索约 ¥1.2

### Supabase
- **免费额度**: 500MB 数据库，2GB 传输/月
- **预估**: 免费额度足够初期使用

**总结**: 每月 1000 次搜索，成本约 ¥5-10（或完全免费）

---

## 🧪 测试用例

推荐以下作品名进行测试：

### 1. 标准名称
- `新世纪福音战士`
- `Neon Genesis Evangelion`
- `新世紀エヴァンゲリオン`

### 2. 简称/别名
- `EVA`（会触发消歧）
- `原神`
- `Genshin`

### 3. 游戏
- `原神`
- `Genshin Impact`
- `崩坏：星穹铁道`

### 4. 轻小说
- `刀剑神域`
- `Sword Art Online`
- `涼宮ハルヒの憂鬱`

---

## 🔧 故障排查

### 问题 1: API 调用 404

**可能原因**:
- Vercel 路由配置错误
- API 文件不在 `frontend/api/` 目录

**解决**:
1. 确认 `vercel.json` 存在于项目根目录
2. 确认 API 文件路径正确
3. 重新部署：`vercel --prod`

### 问题 2: 环境变量未生效

**可能原因**:
- 环境变量未在 Vercel 配置
- 变量名拼写错误

**解决**:
1. 在 Vercel Dashboard → Settings → Environment Variables 检查
2. 确认所有 6 个变量都已添加
3. 重新部署

### 问题 3: Firecrawl 抓取失败

**可能原因**:
- API Key 无效
- 配额用完
- 目标网站反爬虫

**解决**:
1. 检查 Firecrawl Dashboard: https://firecrawl.dev/dashboard
2. 验证 API Key 是否正确
3. 查看 Vercel 日志：`vercel logs`

### 问题 4: DeepSeek 提取不准确

**优化方案**:
1. 调整 prompt（在 API 文件中）
2. 增加温度参数（temperature）
3. 提供更多示例（few-shot learning）

---

## 🎯 优化建议

### 1. 减少 API 调用成本

✅ **已实现**:
- 数据库模糊查询优先
- 只在确认新作品时才抓取

🔄 **可选优化**:
- 添加 Redis 缓存层
- 批量处理请求

### 2. 提高准确率

✅ **已实现**:
- 多源对比（3 个百科）
- AI 消歧

🔄 **可选优化**:
- 增强 `alias` 字段（存储所有别名）
- 使用 PostgreSQL 全文搜索（pg_trgm）
- 添加人工审核环节

### 3. 扩展数据来源

可以添加更多数据源：
- MyAnimeList (myanimelist.net)
- AniDB (anidb.net)
- Bangumi (bgm.tv)
- 豆瓣 (douban.com)

---

## 📚 相关文档

- **部署指南**: [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md)
- **环境变量**: [`ENV_SETUP.md`](./ENV_SETUP.md)
- **数据库设置**: [`SETUP_DATABASE.md`](./SETUP_DATABASE.md)

---

## ✅ 功能完成！

现在你的 ACGN 人格数据库已经具备完整的自动化作品采集功能了！

用户只需要输入作品名，系统就会：
1. ✅ 智能去重（数据库 + AI）
2. ✅ 自动抓取 3 个权威来源
3. ✅ 提取角色信息
4. ✅ 创建完整的数据库记录

所有这些都在 10-30 秒内自动完成！🎉
