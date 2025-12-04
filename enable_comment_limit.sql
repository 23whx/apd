-- =====================================================
-- 启用评论限制：每个用户对每个目标只能评论一次
-- 在 Supabase SQL Editor 中执行此脚本
-- =====================================================

-- 创建唯一索引（部分索引，只对未删除的评论生效）
CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_unique_user_target 
ON comments (target_type, target_id, user_id) 
WHERE is_deleted = false;

-- 验证索引创建成功
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'comments'
  AND indexname = 'idx_comments_unique_user_target';

-- 预期结果：
-- indexname: idx_comments_unique_user_target
-- indexdef: CREATE UNIQUE INDEX idx_comments_unique_user_target ON public.comments 
--           USING btree (target_type, target_id, user_id) WHERE (is_deleted = false)

