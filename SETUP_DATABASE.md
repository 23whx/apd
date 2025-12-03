# Supabase 数据库部署指南

## 方法 1：通过 Supabase Dashboard（推荐）

1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc
2. 左侧菜单选择 **SQL Editor**
3. 点击 **New query**
4. 复制项目根目录的 `supabase-schema.sql` 文件内容
5. 粘贴到 SQL Editor
6. 点击 **Run** 执行

## 方法 2：使用 Supabase CLI

```bash
# 1. 安装 Supabase CLI（如果还没安装）
npm install -g supabase

# 2. 登录 Supabase
supabase login

# 3. 链接项目
supabase link --project-ref nypyccgkrxrvujavplrc

# 4. 执行 SQL
supabase db push
```

## 验证部署

执行完 SQL 后，在 Supabase Dashboard 的 **Table Editor** 里应该能看到以下表：

- `users` - 用户表
- `works` - 作品表
- `characters` - 角色表
- `personality_votes` - 人格投票表
- `comments` - 评论表
- `source_snapshots` - 数据源快照表

## 测试数据

可以先手动插入一些测试数据：

```sql
-- 注意：需要先注册一个用户（通过前端页面），然后才能插入 works
-- 假设你的用户 ID 是 'your-user-uuid'

INSERT INTO works (name_cn, name_en, type, created_by) VALUES
('新世纪福音战士', 'Neon Genesis Evangelion', 'anime', 'your-user-uuid'),
('原神', 'Genshin Impact', 'game', 'your-user-uuid'),
('诡秘之主', 'Lord of the Mysteries', 'novel', 'your-user-uuid');
```

## 环境变量配置

确保 `frontend/.env` 文件包含：

```env
VITE_SUPABASE_URL=https://nypyccgkrxrvujavplrc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55cHljY2drcnhydnVqYXZwbHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDIyOTUsImV4cCI6MjA4MDMxODI5NX0.eOENHTqEJyBK2pbqdXikiR_s8sZaaEQlI2zENOC_kK0
```

## 重启开发服务器

```bash
cd frontend
npm run dev
```

现在访问 http://localhost:5173/ 应该能正常连接到 Supabase 数据库了！

