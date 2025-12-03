# 🎭 ACGN Personality Database

> 一个基于 React + Supabase + Vercel 的 ACGN 角色人格投票平台

![EVA Theme](https://img.shields.io/badge/Style-EVA%20/%20NERV-purple)
![License](https://img.shields.io/badge/License-MIT-green)
![Deployment](https://img.shields.io/badge/Deploy-Vercel-black)

---

## ✨ 功能特性

### 核心功能

- ✅ **用户系统** - 注册/登录，Google/GitHub OAuth，个人资料
- ✅ **智能搜索** - 数据库模糊查询 + AI 消歧（DeepSeek）
- ✅ **自动采集** - Firecrawl 抓取萌娘百科、维基、百度百科
- ✅ **角色提取** - AI 自动识别并提取角色信息
- ✅ **人格投票** - MBTI、九型人格、副型、易学人格学
- ✅ **评论系统** - 评论、回复、点赞
- ✅ **多语言** - 中文、英文、日文（i18n）

### UI 设计

- 🎨 **EVA/NERV 风格** - 暗色调、霓虹绿、高对比度
- 🌐 **响应式设计** - 完美适配桌面/平板/手机
- ⚡ **极致性能** - Vite 构建，全局 CDN 加速

---

## 🏗️ 技术栈

| 分类 | 技术 |
|------|------|
| **前端** | React 19 + TypeScript + Vite |
| **样式** | Tailwind CSS 3.4 |
| **路由** | React Router 7 |
| **图标** | Lucide Icons |
| **国际化** | i18next |
| **图表** | Recharts |
| **后端** | Vercel Serverless Functions |
| **数据库** | Supabase PostgreSQL |
| **认证** | Supabase Auth (Email + OAuth) |
| **爬虫** | Firecrawl API |
| **AI** | DeepSeek API |
| **部署** | Vercel (前端 + API) + Supabase (数据库) |

---

## 🚀 快速开始

### 前置要求

- Node.js 20.18+
- npm 或 yarn
- Supabase 账号
- Vercel 账号（部署用）

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/APD.git
cd APD

# 2. 安装依赖
cd frontend
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 Supabase URL 和 API Keys

# 4. 启动开发服务器
npm run dev

# 5. 访问
# http://localhost:5173/
```

### 部署到 Vercel

**方式 A：一键部署（推荐）**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/APD)

**方式 B：CLI 部署**

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel login
vercel --prod
```

**详细步骤**：查看 [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md)

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [`VERCEL_DEPLOYMENT.md`](./VERCEL_DEPLOYMENT.md) | Vercel 部署完整指南 |
| [`SEARCH_FEATURE_SETUP.md`](./SEARCH_FEATURE_SETUP.md) | 搜索功能详细说明 |
| [`ENV_SETUP.md`](./ENV_SETUP.md) | 环境变量配置 |
| [`SETUP_DATABASE.md`](./SETUP_DATABASE.md) | Supabase 数据库设置 |
| [`OAUTH_SETUP.md`](./OAUTH_SETUP.md) | OAuth 配置（Google/GitHub） |

---

## 🌐 数据来源

系统自动从以下来源抓取 ACGN 作品和角色信息：

- 🌸 **萌娘百科** (zh.moegirl.org.cn) - ACGN 内容最全
- 📖 **维基百科** (zh.wikipedia.org) - 内容权威，多语言
- 📚 **百度百科** (baike.baidu.com) - 中文内容丰富

---

## 🔐 环境变量

在 Vercel 或本地 `.env` 文件中配置：

```env
# Supabase（必需）
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的Anon Key
SUPABASE_URL=https://你的项目.supabase.co
SUPABASE_SERVICE_ROLE_KEY=你的Service Role Key

# 第三方 API（必需）
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

**获取 API Keys**：
- Supabase: https://supabase.com/dashboard
- Firecrawl: https://firecrawl.dev/
- DeepSeek: https://platform.deepseek.com/

---

## 📊 数据库结构

### 主要表

- `users` - 用户信息（扩展 Supabase Auth）
- `works` - ACGN 作品（动画、漫画、游戏、小说）
- `characters` - 角色信息
- `personality_votes` - 人格投票记录
- `comments` - 评论和回复

**完整 Schema**: [`supabase-schema.sql`](./supabase-schema.sql)

---

## 🎯 搜索功能流程

```
用户输入作品名
    ↓
[1] 数据库模糊查询（Postgres ILIKE）
    ├─ 找到相似 → [2] DeepSeek AI 消歧
    │              ├─ 判定重复 → 提示用户
    │              └─ 判定新作 → [3] 继续抓取
    └─ 未找到 → [3] Firecrawl 抓取
                    ↓
        并行抓取 3 个来源（萌娘/维基/百度）
                    ↓
        [4] DeepSeek 提取角色信息
                    ↓
        [5] 创建作品和角色记录
                    ↓
                 完成 ✅
```

**特点**：
- ✅ 智能去重（数据库 + AI）
- ✅ 节省成本（优先本地查询）
- ✅ 多源验证（3 个百科对比）
- ✅ 自动化处理（无需人工干预）

---

## 💰 成本估算

### Vercel（免费额度）

- 带宽: 100GB/月
- Serverless: 100K 次调用/月
- 构建: 6000 分钟/月

### Supabase（免费额度）

- 数据库: 500MB
- 认证: 50K MAU
- 存储: 1GB
- 传输: 2GB/月

### 第三方 API

- **Firecrawl**: $0.004/次，500 次/月免费
- **DeepSeek**: ¥0.001/1K tokens（极便宜）

**预估**：每月约 1000 次搜索，成本约 ¥5-10（或完全免费）

---

## 🛠️ 本地测试 API

```bash
# 使用 Vercel Dev 模拟生产环境
cd frontend
vercel dev

# 访问
# http://localhost:3000
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发规范

- 使用 TypeScript
- 遵循 ESLint 规则
- Commit 信息清晰

---

## 📄 License

MIT License - 查看 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- [Personality-Database](https://www.personality-database.com/) - 灵感来源
- [Supabase](https://supabase.com/) - 开源 Firebase 替代品
- [Vercel](https://vercel.com/) - 极致的开发体验
- [Firecrawl](https://firecrawl.dev/) - 强大的网页抓取工具
- [DeepSeek](https://www.deepseek.com/) - 高性价比的 AI 模型

---

## 📞 联系方式

- **GitHub**: [@你的用户名](https://github.com/你的用户名)
- **Email**: your-email@example.com
- **网站**: https://apd.vercel.app

---

<p align="center">
  Made with ❤️ and ☕
</p>

<p align="center">
  <a href="#-功能特性">功能</a> •
  <a href="#-技术栈">技术栈</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-文档">文档</a>
</p>
