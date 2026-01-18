-- Fix potential issues with external article deletion
-- Ensure article_type defaults are correct and constraints won't block deletion

-- 1) Make sure article_type has a proper default for existing rows
UPDATE blog_posts
SET article_type = 'original'
WHERE article_type IS NULL;

-- 2) Ensure the constraint allows deletion without issues
-- Drop and recreate constraints to be safe
ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_external_url_check;

ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_original_content_check;

-- Recreate with proper logic
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_external_url_check 
  CHECK (
    (article_type = 'original') OR
    (article_type = 'external' AND external_url IS NOT NULL AND external_url != '')
  );

-- For original articles, only check if we're inserting/updating (not deleting)
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_original_content_check
  CHECK (
    (article_type = 'external') OR
    (article_type = 'original' AND (title IS NULL OR (title IS NOT NULL AND content_md IS NOT NULL)))
  );

-- 3) Update the view to include new fields
DROP VIEW IF EXISTS blog_posts_with_author CASCADE;
CREATE OR REPLACE VIEW blog_posts_with_author AS
SELECT 
  bp.*,
  u.username as author_username,
  u.avatar_id as author_avatar_id
FROM blog_posts bp
LEFT JOIN users u ON bp.author_id = u.id;

COMMENT ON VIEW blog_posts_with_author IS 'Blog posts with author info (includes article_type and external_url)';
