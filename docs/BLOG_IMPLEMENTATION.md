# 📝 博客功能实现文档

本文档记录了 APD 项目中博客功能的完整实现。

## 🎯 实现目标

1. ✅ 在 Supabase 中创建博客文章数据表
2. ✅ 为管理员提供文章撰写和管理页面
3. ✅ 创建公开的博客展示页面
4. ✅ 支持 Google AdSense 集成

## 📊 数据库设计

### blog_posts 表结构

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- URL 友好标识符
  content_md TEXT NOT NULL,    -- Markdown 内容
  excerpt TEXT,                -- 文章摘要
  cover_image TEXT,            -- 封面图片
  category TEXT NOT NULL,      -- 分类
  tags TEXT[],                 -- 标签数组
  author_id UUID REFERENCES users(id),
  published BOOLEAN,           -- 发布状态
  published_at TIMESTAMPTZ,    -- 发布时间
  view_count INTEGER,          -- 浏览次数
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 分类系统

- `mbti` - 📊 MBTI 人格类型
- `enneagram-types` - 🎭 九型基本类型
- `enneagram-wings` - 🪶 九型侧翼
- `enneagram-instincts` - 🧭 九型副型
- `yixue` - ☯️ 易学人格学
- `tech` - 💻 技术文章
- `other` - 📝 其他

## 🔐 权限管理 (RLS)

- **公开访问**: 任何人可查看已发布的文章
- **管理员**: 可以创建、编辑、删除文章，查看草稿

## 📄 页面实现

### 1. 管理员文章管理页面
**路径**: `/admin/blog`  
**文件**: `frontend/src/pages/AdminBlogPage.tsx`

功能：
- 查看所有文章列表（包括草稿）
- 搜索文章
- 查看文章状态和统计
- 编辑/删除文章
- 快速新建文章

### 2. 管理员写文章页面
**路径**: `/admin/blog/write` (新建) 和 `/admin/blog/edit/:id` (编辑)  
**文件**: `frontend/src/pages/AdminWriteBlogPage.tsx`

功能：
- Markdown 编辑器
- 自动生成 URL slug
- 分类和标签管理
- 封面图片
- 文章摘要
- 草稿/发布状态切换

### 3. 公开博客列表页
**路径**: `/blog`  
**文件**: `frontend/src/pages/BlogPage.tsx`

功能：
- 展示已发布的文章列表
- 按分类筛选
- 搜索功能
- 显示封面图、摘要、标签
- 显示作者和浏览次数

### 4. 博客详情页
**路径**: `/blog/:slug`  
**文件**: `frontend/src/pages/BlogDetailPage.tsx`

功能：
- 展示完整文章内容（Markdown 渲染）
- 显示元信息（作者、日期、浏览量、标签）
- 自动增加浏览次数
- 评论功能集成
- 分享和导航

## 🔧 技术实现要点

### URL Slug 生成

```typescript
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
```

### 浏览次数统计

使用 Supabase RPC 函数：

```sql
CREATE OR REPLACE FUNCTION increment_post_view_count(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📝 使用指南

### 创建新文章

1. 以管理员身份登录
2. 访问 `/admin/blog`
3. 点击「写新文章」
4. 填写标题、内容、分类等信息
5. 选择保存为草稿或直接发布

### 文章分类建议

#### MBTI 文章
- 单个类型分析：`INTJ-深度解析`
- 类型对比：`INTJ-vs-INTP-区别`
- 认知功能：`Ti-内倾思考功能`

#### 九型人格文章
- 基本类型：`4号-浪漫主义者`
- 侧翼：`4w3-贵族-侧翼分析`
- 副型：`4sp-坚韧者`

#### 易学文章
- 卦象分析：`01-乾为天-创造型领袖`
- 应用：`易学在动漫角色分析中的应用`

## 🚀 SEO 优化

### 元标签建议

每篇文章自动生成：
- `<title>`: 文章标题 - APD Blog
- `<meta name="description">`: 文章摘要
- `<meta name="keywords">`: 标签列表
- Open Graph 标签（用于社交分享）

### URL 结构

```
/blog                     # 博客首页
/blog/mbti-intj-analysis  # 文章详情（使用 slug）
```

## 💰 Google AdSense 集成

### 建议广告位置

1. **文章列表页**
   - 列表顶部横幅广告
   - 列表中间插入广告（每 6 篇文章）

2. **文章详情页**
   - 文章标题下方
   - 文章内容中间
   - 文章结尾处
   - 侧边栏（桌面版）

### 集成代码位置

在 `BlogDetailPage.tsx` 和 `BlogPage.tsx` 中添加 AdSense 代码块：

```tsx
<div className="my-8">
  {/* Google AdSense 代码 */}
  <ins className="adsbygoogle"
       style={{display: 'block'}}
       data-ad-client="ca-pub-XXXXXXXXXX"
       data-ad-slot="XXXXXXXXXX"
       data-ad-format="auto"></ins>
</div>
```

## 📊 数据迁移

### 迁移文件

1. `supabase/migrations/20260115_create_blog_posts.sql` - 创建表和视图
2. `supabase/migrations/20260115_add_blog_functions.sql` - 添加 RPC 函数

### 执行迁移

```bash
# 在 Supabase Dashboard 中执行
# 或使用 Supabase CLI
supabase db reset
```

## 🔗 导航更新

已在 `Navbar.tsx` 中添加博客链接：

```tsx
<Link to="/blog" className="...">
  📝 博客
</Link>
```

## 🎨 样式特点

- 深色 EVA 主题风格
- 响应式设计
- 卡片式布局
- 流畅的悬停动画
- 分类颜色标记

## 📈 未来改进

- [ ] Markdown 富文本编辑器（如 MDX Editor）
- [ ] 文章预览功能
- [ ] 文章版本历史
- [ ] 相关文章推荐
- [ ] RSS 订阅
- [ ] 文章统计分析
- [ ] 社交分享按钮
- [ ] 文章打印样式

## 🐛 已知问题

1. Markdown 渲染目前使用简单的 `pre-wrap`，建议使用 `react-markdown` 或 `marked` 库
2. 需要添加图片上传功能（目前只能使用外部图片链接）

## 📚 相关文档

- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Markdown 语法](https://www.markdownguide.org/)
- [Google AdSense 政策](https://support.google.com/adsense/answer/48182)

---

最后更新：2026-01-15
