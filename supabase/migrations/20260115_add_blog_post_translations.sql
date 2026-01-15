-- Multi-language blog support
-- Split language-specific fields (title/slug/content/excerpt) into a translations table.

-- 1) Add default language to master table (non-breaking)
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS default_lang TEXT NOT NULL DEFAULT 'zh';

-- 2) Translations table
CREATE TABLE IF NOT EXISTS blog_post_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  lang TEXT NOT NULL, -- e.g. 'zh', 'en', 'ja'
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content_md TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, lang),
  UNIQUE (lang, slug)
);

CREATE INDEX IF NOT EXISTS idx_blog_post_translations_post_id ON blog_post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_translations_lang ON blog_post_translations(lang);
CREATE INDEX IF NOT EXISTS idx_blog_post_translations_slug ON blog_post_translations(slug);

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION blog_post_translations_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_post_translations_set_updated_at ON blog_post_translations;
CREATE TRIGGER trg_blog_post_translations_set_updated_at
BEFORE UPDATE ON blog_post_translations
FOR EACH ROW
EXECUTE FUNCTION blog_post_translations_set_updated_at();

-- 4) RLS
ALTER TABLE blog_post_translations ENABLE ROW LEVEL SECURITY;

-- Public can read translations only when the master post is published
DROP POLICY IF EXISTS "Public can read published blog post translations" ON blog_post_translations;
CREATE POLICY "Public can read published blog post translations"
ON blog_post_translations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM blog_posts bp
    WHERE bp.id = blog_post_translations.post_id
      AND bp.published = TRUE
  )
);

-- Admin/mod can manage translations
DROP POLICY IF EXISTS "Admins can manage blog post translations" ON blog_post_translations;
CREATE POLICY "Admins can manage blog post translations"
ON blog_post_translations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'mod')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'mod')
  )
);

-- 5) Backfill existing blog_posts into zh translations (safe to run multiple times)
INSERT INTO blog_post_translations (post_id, lang, slug, title, excerpt, content_md)
SELECT bp.id, 'zh', bp.slug, bp.title, bp.excerpt, bp.content_md
FROM blog_posts bp
WHERE NOT EXISTS (
  SELECT 1 FROM blog_post_translations t
  WHERE t.post_id = bp.id AND t.lang = 'zh'
);

-- 6) New view: translations + master + author
CREATE OR REPLACE VIEW blog_post_translations_with_author AS
SELECT
  t.post_id,
  t.lang,
  t.slug,
  t.title,
  t.excerpt,
  t.content_md,
  bp.cover_image,
  bp.category,
  bp.tags,
  bp.published,
  bp.published_at,
  bp.view_count,
  bp.created_at,
  bp.updated_at,
  u.username AS author_username,
  u.avatar_id AS author_avatar_id
FROM blog_post_translations t
JOIN blog_posts bp ON bp.id = t.post_id
LEFT JOIN users u ON bp.author_id = u.id;

COMMENT ON TABLE blog_post_translations IS '博客文章多语言翻译表（每种语言一行）';
COMMENT ON VIEW blog_post_translations_with_author IS '博客文章翻译 + 主文章 + 作者信息（包含所有语言版本）';

