# 角色编辑保存失败问题修复报告

## 📋 问题总结

### 现象
- 用户在"编辑角色"页面修改 `avatar_url`（角色头像链接）后点击"保存修改"
- 前端显示"保存成功"或跳转到角色详情页
- **但数据库中的 `avatar_url` 值没有实际更新**
- 再次进入编辑页时，仍然看到旧的百度图片链接

### 根本原因

**Supabase RLS（Row Level Security）权限配置缺失**

从控制台日志可以看到：
```
[EditCharacter] Supabase 返回 data: []
[EditCharacter] Supabase 返回 error: null
```

这是典型的 RLS 静默拒绝现象：
- `error: null` - Supabase 没有返回错误
- `data: []` - 但更新操作被 RLS 策略拒绝，返回空数组
- **没有任何行被更新**

原因：`characters` 表启用了 RLS，但缺少允许管理员执行 UPDATE 操作的策略。

---

## 🔧 修复方案

### 1. 数据库层面：添加 RLS UPDATE 策略

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow update for admins and creators" ON characters;

-- 创建新的 UPDATE 策略
CREATE POLICY "Allow update for admins and creators" ON characters
FOR UPDATE
USING (
  -- 允许 admin 或 mod 角色更新
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'mod')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('admin', 'mod')
  )
);
```

**策略说明：**
- `USING` 子句：决定用户能看到（因此能尝试更新）哪些行
- `WITH CHECK` 子句：验证更新后的数据是否符合条件
- 两者都检查当前用户在 `users` 表中的 `role` 是否为 `admin` 或 `mod`

### 2. 前端代码层面：增强错误检测

**修改位置：** `frontend/src/pages/EditCharacterPage.tsx`

#### 修改 1：保存逻辑添加详细日志和错误处理

```typescript
const handleSave = async () => {
  // ... 省略前置检查 ...

  try {
    console.log('[EditCharacter] 准备保存，当前 avatarUrl:', avatarUrl);
    console.log('[EditCharacter] 角色 ID:', id);

    const updateData = {
      name_cn: nameCn.trim(),
      name_en: nameEn.trim() || null,
      name_jp: nameJp.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    };

    console.log('[EditCharacter] 更新数据:', updateData);

    // 关键：加上 .select() 返回更新后的数据
    const { data, error: updateError } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .select(); // ← 必须加这个

    console.log('[EditCharacter] Supabase 返回 data:', data);
    console.log('[EditCharacter] Supabase 返回 error:', updateError);

    if (updateError) {
      throw updateError;
    }

    // 关键：检查是否真的有行被更新
    if (!data || data.length === 0) {
      throw new Error('更新失败：没有找到对应的角色记录，可能是权限不足或记录不存在');
    }

    alert('保存成功！');
    navigate(`/characters/${id}`);
  } catch (err: any) {
    console.error('[EditCharacter] 保存出错:', err);
    const errorMsg = err.message || '保存失败';
    setError(errorMsg);
    alert(`保存失败：${errorMsg}`); // 明确提示用户
  } finally {
    setSaving(false);
  }
};
```

#### 修改 2：过滤防盗链图片源

为避免编辑页自动预填无法访问的图片链接（百度、花瓣等），在加载角色数据时：

```typescript
const fetchCharacter = async () => {
  // ... 省略前面的代码 ...

  const existingAvatar: string | null = characterData.avatar_url || null;
  
  // 如果是百度 / 花瓣等防盗链域名，不再预填
  if (
    existingAvatar &&
    (existingAvatar.includes('pics.baidu.com') ||
      existingAvatar.includes('pics0.baidu.com') ||
      existingAvatar.includes('pics1.baidu.com') ||
      existingAvatar.includes('pics2.baidu.com') ||
      existingAvatar.includes('pics3.baidu.com') ||
      existingAvatar.includes('huaban.com'))
  ) {
    setAvatarUrl(''); // 设为空，强制用户重新输入可用链接
  } else {
    setAvatarUrl(existingAvatar || '');
  }
};
```

---

## ✅ 验证步骤

### 1. 验证 RLS 策略已生效

执行以下 SQL 查询：

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'characters' AND cmd = 'UPDATE';
```

期望输出：
```
schemaname | tablename  | policyname                            | cmd
-----------+------------+---------------------------------------+--------
public     | characters | Allow update for admins and creators  | UPDATE
```

### 2. 前端测试流程

1. **确认管理员身份**
   - 在 Supabase SQL Editor 执行：
     ```sql
     SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
     ```
   - 确认 `role` 为 `admin` 或 `mod`

2. **测试编辑角色**
   - 访问角色编辑页：`/admin/characters/:id/edit`
   - 修改 `avatar_url` 为可用链接，例如：
     ```
     https://upload.wikimedia.org/wikipedia/zh/8/8c/MikasaAckerman.png
     ```
   - 点击"保存修改"

3. **检查控制台日志**
   - 打开浏览器 DevTools → Console
   - 应该看到：
     ```
     [EditCharacter] Supabase 返回 data: [{...}]  // 不再是空数组
     [EditCharacter] Supabase 返回 error: null
     ```

4. **验证数据库**
   - 在 Supabase 执行：
     ```sql
     SELECT id, name_cn, avatar_url 
     FROM characters 
     WHERE id = '你的角色ID';
     ```
   - 确认 `avatar_url` 已更新为新链接

5. **验证前端显示**
   - 访问角色详情页：`/characters/:id`
   - 确认头像图片正常显示

---

## 📊 修复前后对比

| 项目 | 修复前 | 修复后 |
|-----|--------|--------|
| **RLS UPDATE 策略** | ❌ 缺失 | ✅ 已配置 |
| **前端错误提示** | ⚠️ 静默失败 | ✅ 明确报错 |
| **控制台日志** | ⚠️ 无详细信息 | ✅ 完整调试日志 |
| **防盗链图片** | ❌ 自动预填 | ✅ 自动过滤 |
| **保存行为** | ❌ 数据未更新 | ✅ 正常保存 |

---

## 🎯 后续建议

### 1. 完善其他表的 RLS 策略

检查以下表是否也需要类似的 UPDATE 策略：
- `works` 表（作品信息）
- `users` 表（用户信息，Profile 保存）
- `comments` 表（评论编辑）

### 2. 统一错误处理

建议在所有编辑/保存操作中：
- 都加上 `.select()` 返回更新后的数据
- 检查 `data.length === 0` 的情况
- 提供明确的错误提示

### 3. 权限测试清单

| 操作 | 游客 | 普通用户 | Mod | Admin |
|-----|------|---------|-----|-------|
| 查看角色 | ✅ | ✅ | ✅ | ✅ |
| 提交角色 | ❌ | ✅ | ✅ | ✅ |
| 编辑角色 | ❌ | ❌ | ✅ | ✅ |
| 删除角色 | ❌ | ❌ | ✅ | ✅ |

---

## 📝 相关文件

- **前端代码：** `frontend/src/pages/EditCharacterPage.tsx`
- **数据库 Schema：** `supabase-schema.sql`
- **RLS 策略文档：** Supabase Dashboard → Authentication → Policies

---

## 🔗 参考资料

- [Supabase Row Level Security 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy 语法](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [Supabase JS Client Update 方法](https://supabase.com/docs/reference/javascript/update)

---

**修复完成时间：** 2025-01-XX  
**修复人员：** AI Assistant  
**测试状态：** ⏳ 待用户验证

