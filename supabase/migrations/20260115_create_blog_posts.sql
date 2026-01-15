-- 创建博客文章表
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL友好的唯一标识符
  content_md TEXT NOT NULL, -- Markdown格式的内容
  excerpt TEXT, -- 文章摘要/简介
  cover_image TEXT, -- 封面图片URL
  
  -- 分类和标签
  category TEXT NOT NULL CHECK (category IN (
    'mbti', 
    'enneagram-types', 
    'enneagram-wings', 
    'enneagram-instincts', 
    'yixue',
    'tech',
    'other'
  )),
  tags TEXT[] DEFAULT '{}', -- 标签数组
  
  -- 作者和状态
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT false, -- 是否发布
  published_at TIMESTAMPTZ, -- 发布时间
  
  -- 统计数据
  view_count INTEGER DEFAULT 0, -- 浏览次数
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- 创建更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- 启用 RLS (Row Level Security)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 策略：任何人都可以查看已发布的文章
CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published = true);

-- 策略：管理员可以查看所有文章（包括草稿）
CREATE POLICY "Admins can view all blog posts"
  ON blog_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mod')
    )
  );

-- 策略：管理员可以创建文章
CREATE POLICY "Admins can create blog posts"
  ON blog_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mod')
    )
  );

-- 策略：管理员可以更新文章
CREATE POLICY "Admins can update blog posts"
  ON blog_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mod')
    )
  );

-- 策略：管理员可以删除文章
CREATE POLICY "Admins can delete blog posts"
  ON blog_posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'mod')
    )
  );

-- 创建视图：获取文章及作者信息
CREATE OR REPLACE VIEW blog_posts_with_author AS
SELECT 
  bp.*,
  u.username as author_username,
  u.avatar_id as author_avatar_id
FROM blog_posts bp
LEFT JOIN users u ON bp.author_id = u.id;

-- 注释
COMMENT ON TABLE blog_posts IS '博客文章表';
COMMENT ON COLUMN blog_posts.slug IS 'URL友好的唯一标识符，用于生成文章链接';
COMMENT ON COLUMN blog_posts.content_md IS 'Markdown格式的文章内容';
COMMENT ON COLUMN blog_posts.category IS '文章分类：mbti, enneagram-types, enneagram-wings, enneagram-instincts, yixue, tech, other';
COMMENT ON COLUMN blog_posts.published IS '是否已发布（false为草稿状态）';
COMMENT ON COLUMN blog_posts.view_count IS '文章浏览次数';
