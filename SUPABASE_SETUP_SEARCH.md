# Supabase 搜索功能设置

为了让主页搜索功能正常工作，你需要在 Supabase 后台创建一个搜索函数。

## 步骤

### 1. 登录 Supabase Dashboard

访问 [https://supabase.com/dashboard](https://supabase.com/dashboard) 并登录

### 2. 选择你的项目

选择项目：`nypyccgkrxrvujavplrc`

### 3. 打开 SQL Editor

在左侧菜单中点击 **SQL Editor** (或直接访问 https://supabase.com/dashboard/project/nypyccgkrxrvujavplrc/sql/new)

### 4. 执行 SQL

复制以下 SQL 代码并点击 **Run** 执行：

```sql
-- 创建搜索函数
CREATE OR REPLACE FUNCTION search_works(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name_cn TEXT,
  name_en TEXT,
  name_jp TEXT,
  type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name_cn,
    w.name_en,
    w.name_jp,
    w.type
  FROM works w
  WHERE 
    w.name_cn ILIKE '%' || search_query || '%' OR
    w.name_en ILIKE '%' || search_query || '%' OR
    w.name_jp ILIKE '%' || search_query || '%'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

### 5. 添加作品海报字段

执行以下 SQL 为 works 表添加 poster_url 字段：

```sql
ALTER TABLE works ADD COLUMN poster_url TEXT;
```

### 6. 执行数据库迁移（支持多类型作品）

**重要**：作品类型已改为支持多选（例如，一部作品可以同时是动画和漫画）。执行以下 SQL：

```sql
-- 修改 works 表的 type 字段为 JSONB 数组，支持多类型

-- 1. 添加临时列
ALTER TABLE works ADD COLUMN type_array JSONB;

-- 2. 迁移现有数据：将单个 type 转换为数组
UPDATE works SET type_array = to_jsonb(ARRAY[type]);

-- 3. 删除旧的 type 列
ALTER TABLE works DROP COLUMN type;

-- 4. 重命名新列为 type
ALTER TABLE works RENAME COLUMN type_array TO type;

-- 5. 设置默认值和非空约束
ALTER TABLE works ALTER COLUMN type SET DEFAULT '["anime"]'::jsonb;
ALTER TABLE works ALTER COLUMN type SET NOT NULL;

-- 6. 更新索引
DROP INDEX IF EXISTS idx_works_type;
CREATE INDEX idx_works_type ON works USING GIN (type);

-- 7. 添加检查约束（确保是非空数组）
ALTER TABLE works ADD CONSTRAINT check_type_is_array
CHECK (jsonb_typeof(type) = 'array' AND jsonb_array_length(type) > 0);
```

### 6. 重新创建搜索函数（支持新的类型格式）

```sql
-- 删除旧函数
DROP FUNCTION IF EXISTS search_works(text);

-- 创建新函数
CREATE OR REPLACE FUNCTION search_works(search_query TEXT)
RETURNS TABLE (
  id UUID,
  name_cn TEXT,
  name_en TEXT,
  name_jp TEXT,
  type JSONB,
  poster_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name_cn,
    w.name_en,
    w.name_jp,
    w.type,
    w.poster_url
  FROM works w
  WHERE 
    w.name_cn ILIKE '%' || search_query || '%' OR
    w.name_en ILIKE '%' || search_query || '%' OR
    w.name_jp ILIKE '%' || search_query || '%'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

### 7. 测试函数

执行完成后，你可以测试函数是否正常工作：

```sql
SELECT * FROM search_works('进击的巨人');
```

如果返回结果（即使是空），说明函数创建成功！

## 注意事项

- 如果不创建这个函数，搜索功能会自动跳转到作品列表页，让用户手动筛选
- 创建函数后，搜索会更快更准确
- 这个函数会同时搜索中文、英文和日文名称
- **作品类型现在是数组**，一部作品可以有多个类型（如同时是 anime 和 manga）

## 故障排除

如果执行 SQL 时出现权限错误，请确保：
1. 你已经以项目 Owner 或 Admin 身份登录
2. 数据库中已经存在 `works` 表（参考 `supabase-schema.sql`）
3. 如果数据库中已有数据，迁移脚本会自动将旧的单类型转换为数组格式

