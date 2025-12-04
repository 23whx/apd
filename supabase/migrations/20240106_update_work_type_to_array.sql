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

-- 7. 添加简单的检查约束（确保是非空数组）
ALTER TABLE works ADD CONSTRAINT check_type_is_array
CHECK (jsonb_typeof(type) = 'array' AND jsonb_array_length(type) > 0);

