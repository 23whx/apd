# 🐛 用户权限和显示名称问题调试指南

## 📋 问题现象

1. **刚进入页面时，系统判定不出管理员角色**
2. **用户名显示的是邮箱前缀，而不是 `display_name`**

## 🔍 根本原因

**`users` 表的 RLS 策略缺失**，导致：

1. **首次登录时**，`AuthContext.ensureUserProfile()` 尝试 `upsert` 用户记录到 `users` 表
   - 被 RLS 拒绝（403 Forbidden）
   - `users` 表中**没有该用户的记录**

2. **后续访问时**：
   - `AdminPage` 查询 `users.role` → 查不到记录 → 判定为"无权限"
   - `Navbar` 查询 `users.display_name` → 查不到记录 → 只能显示邮箱前缀

## ✅ 完整修复步骤

### 第 1 步：执行 SQL 修复 RLS 策略

在 **Supabase SQL Editor** 中执行 `fix_users_rls.sql` 文件中的 SQL：

```sql
-- 1. 检查当前策略
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users';

-- 2. 删除旧策略
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- 3. 创建新策略
-- 允许用户查看自己的记录
CREATE POLICY "Users can view their own profile" ON users
FOR SELECT
USING (
  auth.uid() = id
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'mod')
  )
);

-- 允许用户首次登录时插入记录
CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的记录
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND
  (role IS NULL OR role = 'user' OR 
   EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'mod')))
);
```

### 第 2 步：验证策略创建成功

执行：

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
```

期望输出：

| policyname | cmd |
|-----------|-----|
| Users can insert their own profile | INSERT |
| Users can view their own profile | SELECT |
| Users can update their own profile | UPDATE |

### 第 3 步：检查当前用户记录

```sql
SELECT id, email, username, display_name, role, created_at
FROM users
WHERE email = 'your-email@example.com';  -- 替换为你的邮箱
```

**如果返回空：** 说明 `users` 表中还没有你的记录

### 第 4 步：重新登录前端

1. **清除浏览器缓存和 localStorage**：
   - 打开 DevTools → Application → Storage → Clear site data

2. **刷新页面并重新登录**

3. **查看控制台日志**：

期望看到：

```
[AuthContext] ensureUserProfile 开始，用户: your-email@example.com
[AuthContext] 准备 upsert 的数据: {id: "...", email: "...", username: "...", display_name: "..."}
[AuthContext] upsert 返回 data: [{...}]
[AuthContext] upsert 返回 error: null
[AuthContext] ✅ users 表记录已确保存在
```

**如果看到：**

```
[AuthContext] ❌ users 表 upsert 失败: ...
[AuthContext] ⚠️  users 表 RLS 策略缺失！需要添加 INSERT/UPDATE 策略
```

→ 说明 RLS 策略还没生效，回到第 1 步重新检查

### 第 5 步：设置管理员角色

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';  -- 替换为你的邮箱
```

### 第 6 步：验证修复效果

1. **刷新页面**（Ctrl+Shift+R 硬刷新）

2. **访问 `/admin` 页面**，查看控制台：

```
[Admin Check] 🔍 开始检查用户权限
[Admin Check] 用户邮箱: your-email@example.com
[Admin Check] Supabase 返回 data: {role: "admin", email: "...", display_name: "..."}
[Admin Check] 当前用户角色: admin
[Admin Check] ✅ 权限验证通过
```

3. **查看右上角用户名**，应该显示 `display_name` 而不是邮箱前缀：

```
[Navbar] ✅ 用户资料加载成功
[Navbar] display_name: Your Display Name
[Navbar] 最终显示名称: Your Display Name
```

## 🔧 如果还是失败

### 场景 A：控制台显示 403 Forbidden

```
POST /rest/v1/users?on_conflict=id 403 (Forbidden)
[AuthContext] ❌ users 表 upsert 失败
```

**原因：** RLS 策略没有正确配置

**解决：** 重新执行第 1 步的 SQL，确保所有策略都创建成功

### 场景 B：控制台显示 PGRST116 错误

```
[Admin Check] ❌ 数据库查询失败: ...
[Admin Check] ⚠️  users 表中找不到该用户记录！
```

**原因：** `users` 表中没有该用户的记录

**解决：** 手动插入记录（从 `auth.users` 获取 ID）：

```sql
-- 1. 先从 auth.users 获取你的 user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. 手动插入到 users 表
INSERT INTO users (id, email, username, display_name, role)
VALUES (
  'your-user-id-from-step-1',  -- 替换为实际 ID
  'your-email@example.com',
  'your-username',
  'Your Display Name',
  'admin'
);
```

### 场景 C：显示名称还是邮箱前缀

```
[Navbar] ✅ 用户资料加载成功
[Navbar] display_name: null
[Navbar] username: your-email-prefix
[Navbar] 最终显示名称: your-email-prefix
```

**原因：** `users` 表中的 `display_name` 字段为空

**解决：** 手动更新或去 `/profile` 页面修改：

```sql
UPDATE users 
SET display_name = 'Your Preferred Name'
WHERE email = 'your-email@example.com';
```

## 📊 调试清单

| 检查项 | SQL 查询 | 期望结果 |
|--------|---------|---------|
| **users 表 RLS 策略** | `SELECT * FROM pg_policies WHERE tablename = 'users'` | 至少 3 条策略（INSERT, SELECT, UPDATE） |
| **当前用户在 users 表** | `SELECT * FROM users WHERE id = auth.uid()` | 返回 1 条记录 |
| **当前用户角色** | `SELECT role FROM users WHERE id = auth.uid()` | `admin` 或 `mod` |
| **当前用户显示名称** | `SELECT display_name FROM users WHERE id = auth.uid()` | 非空字符串 |

## 🎯 最终验证

所有修复完成后，应该看到：

1. ✅ 访问 `/admin` 页面 → 直接进入，不再提示"权限不足"
2. ✅ 右上角显示 → 你设置的 `display_name`，而不是邮箱前缀
3. ✅ 编辑角色 → 保存成功，数据真正更新到数据库
4. ✅ 控制台日志 → 没有 403 或 PGRST116 错误

## 📝 相关文件

- **SQL 修复脚本：** `fix_users_rls.sql`
- **前端修改：**
  - `frontend/src/contexts/AuthContext.tsx` - 自动创建用户记录
  - `frontend/src/pages/AdminPage.tsx` - 权限检查逻辑
  - `frontend/src/components/Navbar.tsx` - 显示名称获取
  - `frontend/src/pages/EditCharacterPage.tsx` - 角色编辑保存

## 🆘 需要帮助？

如果按照以上步骤还是无法解决，请提供：

1. **执行 `fix_users_rls.sql` 后的所有输出**
2. **浏览器控制台的完整日志**（包括所有 `[AuthContext]`、`[Admin Check]`、`[Navbar]` 开头的日志）
3. **以下 SQL 查询的结果：**
   ```sql
   -- 查询 1
   SELECT * FROM pg_policies WHERE tablename = 'users';
   
   -- 查询 2
   SELECT id, email, username, display_name, role 
   FROM users 
   WHERE email = 'your-email@example.com';
   
   -- 查询 3
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

