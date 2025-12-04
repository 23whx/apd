-- 为 works 表添加 poster_url 字段（海报/封面/宣传图）
ALTER TABLE works ADD COLUMN poster_url TEXT;

-- 添加注释
COMMENT ON COLUMN works.poster_url IS 'Poster/Cover/Promotional image URL';

