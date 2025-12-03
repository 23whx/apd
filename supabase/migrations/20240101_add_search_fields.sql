-- Migration: Add fields for search and scraping features
-- 确保 works 表有必要的字段用于搜索和爬取功能

-- 添加 alias 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'alias'
    ) THEN
        ALTER TABLE works ADD COLUMN alias JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 添加 type 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'type'
    ) THEN
        ALTER TABLE works ADD COLUMN type TEXT NOT NULL DEFAULT 'anime' CHECK (type IN ('anime', 'manga', 'game', 'novel'));
    END IF;
END $$;

-- 添加 summary_md 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'summary_md'
    ) THEN
        ALTER TABLE works ADD COLUMN summary_md TEXT;
    END IF;
END $$;

-- 添加 source_urls 字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'source_urls'
    ) THEN
        ALTER TABLE works ADD COLUMN source_urls JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 创建索引以优化搜索
CREATE INDEX IF NOT EXISTS idx_works_name_cn ON works USING gin(name_cn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_works_name_en ON works USING gin(name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_works_name_jp ON works USING gin(name_jp gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_works_alias ON works USING gin(alias);

-- 启用 pg_trgm 扩展以支持模糊搜索（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 添加评论
COMMENT ON COLUMN works.alias IS '作品的所有别名（数组），用于消歧和搜索';
COMMENT ON COLUMN works.summary_md IS '作品简介（Markdown格式，50字以内）';
COMMENT ON COLUMN works.source_urls IS '抓取来源的URL（JSON对象）：{ "moegirl": "...", "wikipedia": "...", "baike": "..." }';
COMMENT ON COLUMN works.type IS '作品类型：anime（动画）, manga（漫画）, game（游戏）, novel（小说）';

