# 投票功能 400 错误修复指南

## 🔴 问题描述

投票页面控制台出现 400 Bad Request 错误：
```
personality_votes?columns=%22character_id%22%2C%22user_id%22%2C%22mbti%22%2C%22enneagram%22%2C%22su…
Failed to load resource: the server responded with a status of 400
```

## 🔍 根本原因

### 1. 数据库约束未更新
**问题：** 
- 前端已更新为 6 个新的 subtype 值：`sp/sx`, `sp/so`, `sx/sp`, `sx/so`, `so/sp`, `so/sx`
- 数据库约束还停留在旧的 3 个值：`sx`, `so`, `sp`

**影响：**
- 用户提交新的 subtype 值时被数据库拒绝
- 错误信息：`violates check constraint "personality_votes_subtype_check"`

### 2. 查询优化
**问题：**
- 查询时使用 `SELECT *` 可能导致不必要的数据传输
- 错误日志不够详细，难以排查问题

## ✅ 修复步骤

### 步骤 1: 更新数据库约束（必须执行）

在 **Supabase SQL Editor** 中执行以下 SQL：

```sql
-- 删除旧的约束
ALTER TABLE personality_votes
DROP CONSTRAINT IF EXISTS personality_votes_subtype_check;

-- 添加新的约束，支持 6 个 Instinctual Variant 组合
ALTER TABLE personality_votes
ADD CONSTRAINT personality_votes_subtype_check 
CHECK (
  subtype IS NULL OR 
  subtype IN ('sp/sx', 'sp/so', 'sx/sp', 'sx/so', 'so/sp', 'so/sx')
);

-- 验证约束已更新
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'personality_votes_subtype_check';
```

**预期结果：**
```
constraint_name                    | constraint_definition
-----------------------------------+-------------------------------------------------------
personality_votes_subtype_check    | CHECK ((subtype IS NULL) OR (subtype = ANY (ARRAY[
                                   | 'sp/sx'::text, 'sp/so'::text, 'sx/sp'::text, 
                                   | 'sx/so'::text, 'so/sp'::text, 'so/sx'::text])))
```

### 步骤 2: 前端代码优化（已完成）

#### 优化 1: 精简查询字段
```typescript
// ❌ 之前：查询所有字段
.select('*')

// ✅ 现在：只查询需要的字段
.select('mbti, enneagram, subtype, yi_hexagram')
```

#### 优化 2: 添加详细错误日志
```typescript
if (error) {
  console.error('[VotePanel] Failed to fetch existing vote:', error);
  console.error('[VotePanel] Error details:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
  return;
}
```

#### 优化 3: 延迟加载避免冲突
```typescript
useEffect(() => {
  if (user && characterId) {
    // 延迟 100ms 执行，避免与页面初始化冲突
    const timer = setTimeout(() => {
      fetchExistingVote();
    }, 100);
    return () => clearTimeout(timer);
  }
}, [user, characterId]);
```

## 📊 验证步骤

### 1. 执行完 SQL 后，验证约束：
```sql
-- 应该返回成功
INSERT INTO personality_votes (character_id, user_id, subtype) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  '00000000-0000-0000-0000-000000000002', 
  'sp/sx'
);

-- 清理测试数据
DELETE FROM personality_votes 
WHERE character_id = '00000000-0000-0000-0000-000000000001';
```

### 2. 前端测试：
1. **清除浏览器缓存**（Ctrl + Shift + Delete）
2. **刷新页面**（Ctrl + F5）
3. 打开开发者工具，查看 Console 和 Network 面板
4. 进入任意角色详情页
5. 尝试投票，选择 `sx/sp` 等新值
6. 点击 "Submit Vote"

**预期结果：**
- ✅ Console 无 400 错误
- ✅ Network 面板显示 `personality_votes` 请求返回 200/201
- ✅ 页面显示 "Vote submitted successfully!"

## 🔧 故障排查

### 如果还是 400 错误：

#### 检查 1: 数据库约束
```sql
SELECT 
  conname,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'personality_votes'::regclass
  AND contype = 'c'; -- check constraints
```

#### 检查 2: RLS 策略
```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'personality_votes';
```

#### 检查 3: 浏览器缓存
- 完全清除浏览器缓存
- 或使用无痕模式测试

#### 检查 4: 查看详细错误
打开浏览器开发者工具 > Console，查看完整的错误堆栈信息。

## 📝 Subtype 值说明

| 值 | 主导本能 | 次要本能 | 说明 |
|---|---|---|---|
| `sp/sx` | Self-Preservation | Sexual | 自我保存型为主，性本能为辅 |
| `sp/so` | Self-Preservation | Social | 自我保存型为主，社交型为辅 |
| `sx/sp` | Sexual | Self-Preservation | 性本能型为主，自我保存为辅 |
| `sx/so` | Sexual | Social | 性本能型为主，社交型为辅 |
| `so/sp` | Social | Self-Preservation | 社交型为主，自我保存为辅 |
| `so/sx` | Social | Sexual | 社交型为主，性本能为辅 |

## 🎯 总结

**核心问题：** 数据库约束过时，前端更新了但数据库没有同步更新。

**解决方案：** 
1. ✅ 更新数据库约束（必须）
2. ✅ 优化前端查询（已完成）
3. ✅ 增强错误处理（已完成）

**执行后效果：**
- 投票功能完全正常
- 支持所有 6 个 Instinctual Variant 组合
- 错误日志更详细，便于排查问题

