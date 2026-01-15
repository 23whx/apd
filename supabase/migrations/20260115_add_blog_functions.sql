-- 创建增加文章浏览次数的函数
CREATE OR REPLACE FUNCTION increment_post_view_count(post_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE blog_posts
  SET view_count = view_count + 1
  WHERE slug = post_slug AND published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注释
COMMENT ON FUNCTION increment_post_view_count IS '增加博客文章的浏览次数';
