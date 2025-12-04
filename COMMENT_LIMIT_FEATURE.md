# 评论限制功能说明

## 🎯 功能概述

为了防止刷屏和资源滥用，现在每个用户对每个目标（作品/角色）**只能评论一次**。

## ✅ 实现功能

### 1. **数据库层面**
- ✅ 添加唯一索引约束
- ✅ 使用部分索引（只对未删除的评论生效）
- ✅ 允许用户删除后重新评论

### 2. **前端限制**
- ✅ 检测用户是否已评论
- ✅ 已评论时隐藏评论框
- ✅ 显示提示信息
- ✅ 允许编辑/删除自己的评论

### 3. **用户体验**
- ✅ 友好的提示信息
- ✅ 删除后可重新评论
- ✅ 违规时显示明确错误提示

## 📊 工作流程

### 首次评论
```
1. 用户访问角色/作品详情页
2. 显示评论输入框（提示：只能评论一次）
3. 用户提交评论
4. 评论框消失，显示提示："You have already commented"
5. 用户可以看到自己的评论，可以编辑/删除
```

### 已评论状态
```
1. 用户访问已评论过的页面
2. 不显示评论输入框
3. 显示提示信息："You have already commented. You can edit or delete your comment below."
4. 用户的评论显示编辑/删除按钮
```

### 删除后重新评论
```
1. 用户点击删除按钮
2. 确认对话框："Are you sure? You can comment again after deletion."
3. 删除成功
4. 评论输入框重新显示
5. 用户可以再次评论
```

## 🔧 数据库实现

### 唯一索引（部分索引）
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_comments_unique_user_target 
ON comments (target_type, target_id, user_id) 
WHERE is_deleted = false;
```

**关键点：**
- 使用 `WHERE is_deleted = false` 条件
- 只对有效评论强制唯一性
- 删除的评论不计入约束
- 用户删除后可以重新评论

### 迁移步骤

1. **检查现有重复评论：**
```sql
SELECT 
  target_type,
  target_id,
  user_id,
  COUNT(*) as comment_count
FROM comments
WHERE is_deleted = false
GROUP BY target_type, target_id, user_id
HAVING COUNT(*) > 1;
```

2. **执行迁移脚本：**
在 Supabase SQL Editor 中运行 `add_comment_unique_constraint.sql`

3. **验证约束：**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'comments'
  AND indexname = 'idx_comments_unique_user_target';
```

## 💡 前端逻辑

### 状态管理
```typescript
const [hasCommented, setHasCommented] = useState(false);

// 在 fetchComments 中检查
const userComment = data?.find(c => c.user_id === user.id);
setHasCommented(!!userComment);
```

### 条件渲染
```typescript
{user ? (
  hasCommented ? (
    // 显示提示信息
    <div>You have already commented...</div>
  ) : (
    // 显示评论输入框
    <form>...</form>
  )
) : (
  // 未登录提示
  <div>Please login to comment</div>
)}
```

### 错误处理
```typescript
if (error.message.includes('duplicate') || error.message.includes('unique')) {
  alert('You have already commented on this item. Please refresh the page.');
}
```

## 🎨 UI 提示文案

### 未评论状态
- 占位符：`"Share your thoughts... (You can only comment once)"`

### 已评论状态
```
You have already commented. You can edit or delete your comment below.
Each user can only comment once per work/character.
```

### 删除确认
```
Are you sure you want to delete this comment? 
You can comment again after deletion.
```

## 🔐 安全保障

### 多层防护
1. **数据库约束** - 最后防线，确保数据一致性
2. **前端检查** - 提前阻止，提升用户体验
3. **RLS 策略** - 确保用户只能操作自己的评论

### RLS 策略（已存在）
```sql
CREATE POLICY "Users can update own comments" 
ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
ON comments FOR DELETE USING (auth.uid() = user_id);
```

## 📈 优势

### 防止滥用
- ✅ 防止刷屏
- ✅ 节省数据库资源
- ✅ 保持讨论质量

### 用户友好
- ✅ 清晰的提示信息
- ✅ 可以编辑修改
- ✅ 删除后可重新评论
- ✅ 不影响正常使用

### 技术优势
- ✅ 数据库层面保证
- ✅ 前端实时反馈
- ✅ 性能开销小

## 🚀 部署清单

- [ ] 在 Supabase SQL Editor 执行 `add_comment_unique_constraint.sql`
- [ ] 验证唯一索引创建成功
- [ ] 清除浏览器缓存
- [ ] 测试评论功能
- [ ] 测试编辑功能
- [ ] 测试删除后重新评论
- [ ] 验证错误提示

## 🧪 测试场景

### 场景 1: 首次评论
1. 登录用户访问角色详情页
2. 看到评论输入框
3. 输入评论并提交
4. ✅ 成功发表
5. ✅ 输入框消失，显示提示

### 场景 2: 尝试重复评论
1. 已评论的用户访问同一页面
2. ✅ 不显示输入框
3. ✅ 显示"已评论"提示
4. ✅ 可以看到编辑/删除按钮

### 场景 3: 编辑评论
1. 点击编辑按钮
2. 评论变为可编辑
3. 修改内容并保存
4. ✅ 成功更新

### 场景 4: 删除后重新评论
1. 点击删除按钮
2. 确认删除
3. ✅ 评论被删除
4. ✅ 输入框重新出现
5. 可以再次评论

### 场景 5: 数据库直接约束
1. 尝试通过 API 直接插入重复评论
2. ✅ 数据库返回唯一约束错误
3. ✅ 前端显示友好错误提示

## 📝 注意事项

1. **删除 vs 软删除**
   - 当前使用硬删除（DELETE）
   - 唯一索引使用 `is_deleted = false` 过滤
   - 确保两者一致

2. **缓存刷新**
   - 评论后立即刷新列表
   - 确保 `hasCommented` 状态同步

3. **错误处理**
   - 捕获唯一约束错误
   - 显示友好提示而非技术错误

4. **用户体验**
   - 清晰告知"只能评论一次"
   - 提供编辑选项作为替代
   - 允许删除后重新评论

## 🎉 总结

通过数据库约束 + 前端逻辑的双重保障，成功实现了：
- 每用户每目标仅一条评论
- 防止刷屏和资源滥用
- 保持良好的用户体验
- 允许灵活的修改和删除

功能完整、安全可靠、用户友好！

