-- 检查你的用户角色
-- 请在 Supabase SQL Editor 中执行这个查询

-- 1. 查看你当前登录用户的信息
SELECT id, email, username, display_name, role, created_at
FROM users
WHERE email = 'your-email@example.com';  -- 替换为你的邮箱

-- 2. 如果没有找到记录，查看所有用户
SELECT id, email, username, role
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- 3. 将你的用户设置为管理员（替换为你的邮箱）
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- 4. 验证是否设置成功
SELECT email, role 
FROM users 
WHERE email = 'your-email@example.com';

