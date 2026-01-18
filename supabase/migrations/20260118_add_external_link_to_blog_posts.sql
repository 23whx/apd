-- Add external link support to blog_posts
-- This allows referencing external articles from Zhihu, Bilibili, Medium, etc.

-- 1) Add article_type and external_url to blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS article_type TEXT NOT NULL DEFAULT 'original' CHECK (article_type IN ('original', 'external')),
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- 2) Add constraint: external articles must have external_url
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_external_url_check 
  CHECK (
    (article_type = 'original' AND external_url IS NULL) OR
    (article_type = 'external' AND external_url IS NOT NULL)
  );

-- 3) Make title/content_md nullable for external articles (they might not have full content)
ALTER TABLE blog_posts
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN content_md DROP NOT NULL;

-- 4) Add new constraint: original articles must have title and content
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_original_content_check
  CHECK (
    (article_type = 'external') OR
    (article_type = 'original' AND title IS NOT NULL AND content_md IS NOT NULL)
  );

-- 5) Create index for article_type
CREATE INDEX IF NOT EXISTS idx_blog_posts_article_type ON blog_posts(article_type);

-- 6) Update view to include article_type and external_url
DROP VIEW IF EXISTS blog_posts_with_author;
CREATE OR REPLACE VIEW blog_posts_with_author AS
SELECT 
  bp.*,
  u.username as author_username,
  u.avatar_id as author_avatar_id
FROM blog_posts bp
LEFT JOIN users u ON bp.author_id = u.id;

-- Comments
COMMENT ON COLUMN blog_posts.article_type IS 'Article type: original (self-written) or external (referenced from other sites)';
COMMENT ON COLUMN blog_posts.external_url IS 'External article URL (for external articles only)';
