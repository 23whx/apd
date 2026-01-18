-- Fix external article display issues
-- 1. Update view to include article_type and external_url
-- 2. Ensure external articles can be queried properly

-- Drop and recreate the view with new fields
DROP VIEW IF EXISTS blog_post_translations_with_author CASCADE;

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
  bp.article_type,
  bp.external_url,
  u.username AS author_username,
  u.avatar_id AS author_avatar_id
FROM blog_post_translations t
JOIN blog_posts bp ON bp.id = t.post_id
LEFT JOIN users u ON bp.author_id = u.id;

COMMENT ON VIEW blog_post_translations_with_author IS '博客文章翻译 + 主文章 + 作者信息（包含所有语言版本，包括外链文章标识）';

-- Create a function to automatically create translation when external article is inserted
CREATE OR REPLACE FUNCTION create_translation_for_external_article()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create translation for external articles
  IF NEW.article_type = 'external' THEN
    INSERT INTO blog_post_translations (post_id, lang, slug, title, excerpt, content_md)
    VALUES (
      NEW.id,
      COALESCE(NEW.default_lang, 'zh'),
      NEW.slug,
      COALESCE(NEW.title, '(外部文章)'),
      NEW.excerpt,
      COALESCE(NEW.content_md, '> 本文引用自外部链接')
    )
    ON CONFLICT (post_id, lang) DO UPDATE
    SET
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      content_md = EXCLUDED.content_md,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new external articles
DROP TRIGGER IF EXISTS trg_create_translation_for_external_article ON blog_posts;
CREATE TRIGGER trg_create_translation_for_external_article
AFTER INSERT OR UPDATE ON blog_posts
FOR EACH ROW
WHEN (NEW.article_type = 'external')
EXECUTE FUNCTION create_translation_for_external_article();

-- Backfill: create translations for existing external articles
INSERT INTO blog_post_translations (post_id, lang, slug, title, excerpt, content_md)
SELECT
  bp.id,
  COALESCE(bp.default_lang, 'zh'),
  bp.slug,
  COALESCE(bp.title, '(外部文章)'),
  bp.excerpt,
  COALESCE(bp.content_md, '> 本文引用自外部链接')
FROM blog_posts bp
WHERE bp.article_type = 'external'
  AND NOT EXISTS (
    SELECT 1 FROM blog_post_translations t
    WHERE t.post_id = bp.id
  )
ON CONFLICT (post_id, lang) DO NOTHING;

COMMENT ON FUNCTION create_translation_for_external_article IS '自动为外链文章创建翻译记录，确保能在列表中显示';
