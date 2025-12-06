-- =====================================================
-- 检查并修复 users 表的 RLS 策略
-- =====================================================

-- 1. 检查当前策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- 2. 删除旧的限制性策略（如果存在）
DROP POLICY IF EXISTS "Users can only update their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 3. 创建新的用户自己可以更新的策略
CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. 确保用户可以查看自己的数据
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 5. 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

