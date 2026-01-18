-- Allow 'tritype' as a blog post category
-- The original blog_posts.category CHECK constraint did not include 'tritype',
-- which causes inserts/updates to fail when category = 'tritype'.

DO $$
DECLARE
  c_name text;
BEGIN
  -- Find the CHECK constraint on blog_posts.category (name may vary)
  SELECT con.conname
    INTO c_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'blog_posts'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%category%'
    AND pg_get_constraintdef(con.oid) ILIKE '%CHECK%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.blog_posts DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT blog_posts_category_check
  CHECK (category IN (
    'mbti',
    'enneagram-types',
    'enneagram-wings',
    'enneagram-instincts',
    'tritype',
    'yixue',
    'tech',
    'other'
  ));

