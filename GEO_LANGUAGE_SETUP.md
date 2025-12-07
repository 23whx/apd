# 🌍 基于 IP 的地理位置语言自动切换

## 功能说明

网站会根据用户的 IP 地址自动检测地理位置，并设置相应的默认语言：

| 地区 | 国家代码 | 默认语言 |
|------|---------|---------|
| 中国大陆 | CN | 中文 (zh) |
| 台湾 | TW | 中文 (zh) |
| 香港 | HK | 中文 (zh) |
| 澳门 | MO | 中文 (zh) |
| 新加坡 | SG | 中文 (zh) |
| 日本 | JP | 日语 (ja) |
| 其他地区 | * | 英语 (en) |

## 工作原理

### 1. 优先级顺序

语言选择遵循以下优先级（从高到低）：

1. **用户手动选择**：通过右上角的语言切换按钮（🌐 EN/中/日）
2. **localStorage 存储**：上次访问时的语言设置
3. **IP 地理检测**：基于用户 IP 地址检测国家/地区
4. **默认语言**：英语 (en)

### 2. 地理位置 API

使用两个免费的地理位置 API（带降级机制）：

#### 主 API：ipapi.co
```
https://ipapi.co/json/
```
- **特点**：简单可靠，无需 API Key
- **限制**：1000 次/天
- **超时**：3 秒

#### 备用 API：ip-api.com
```
http://ip-api.com/json/
```
- **特点**：免费，无需 API Key
- **限制**：45 次/分钟
- **超时**：3 秒

### 3. 性能优化

- ✅ **会话缓存**：同一会话内只检测一次，结果存储在 `sessionStorage`
- ✅ **超时控制**：API 请求超时 3 秒自动降级
- ✅ **降级机制**：主 API 失败自动切换备用 API
- ✅ **不干扰用户选择**：如果用户已手动切换语言，不会覆盖

## 文件结构

```
frontend/src/
├── lib/
│   ├── geoLanguage.ts     # 地理位置检测工具
│   └── i18n.ts            # i18n 配置（移除浏览器语言检测）
└── App.tsx                # 应用入口（初始化语言检测）
```

## 代码实现

### `geoLanguage.ts`

```typescript
// 检测并设置语言
export async function detectAndSetLanguage(currentLanguage?: string): Promise<string | null>

// 判断用户是否来自中日韩地区
export async function isFromCJKRegion(): Promise<boolean>
```

### `App.tsx`

```typescript
useEffect(() => {
  const initLanguage = async () => {
    const detectedLang = await detectAndSetLanguage(i18n.language);
    if (detectedLang && detectedLang !== i18n.language) {
      await i18n.changeLanguage(detectedLang);
    }
  };
  initLanguage();
}, []);
```

## 测试方法

### 本地测试

由于本地开发环境 IP 通常是 `127.0.0.1`，地理检测会失败并默认使用英语。可以通过以下方法测试：

1. **手动设置语言**：
   ```javascript
   // 在浏览器控制台执行
   localStorage.setItem('i18nextLng', 'zh'); // 中文
   localStorage.setItem('i18nextLng', 'ja'); // 日语
   localStorage.setItem('i18nextLng', 'en'); // 英语
   ```

2. **清除缓存测试**：
   ```javascript
   // 清除语言缓存，重新检测
   localStorage.removeItem('i18nextLng');
   sessionStorage.removeItem('geoLanguageDetected');
   location.reload();
   ```

3. **模拟不同地区**：
   - 使用 VPN 切换到不同国家
   - 使用代理服务器

### 线上测试

在 Vercel 部署后：

1. 从中国大陆访问 → 应该显示中文
2. 从台湾访问 → 应该显示中文
3. 从日本访问 → 应该显示日语
4. 从美国/欧洲访问 → 应该显示英语

## 调试信息

打开浏览器控制台（F12），可以看到地理检测的调试信息：

```
[GeoLanguage] Detected country: JP Japan
[GeoLanguage] Setting language based on location: ja
[App] Language set to: ja
```

或者如果用户已有语言设置：

```
[GeoLanguage] Using stored language preference: zh
```

## 常见问题

### Q1: 为什么我的语言没有自动切换？

**A**: 检查以下几点：
1. 是否之前手动切换过语言（右上角语言按钮）
2. 清除浏览器缓存：`localStorage.clear()` + `sessionStorage.clear()`
3. 检查控制台是否有错误信息

### Q2: API 调用失败怎么办？

**A**: 系统有自动降级机制：
- 主 API 失败 → 尝试备用 API
- 备用 API 失败 → 默认使用英语
- 不会影响网站正常使用

### Q3: 会增加页面加载时间吗？

**A**: 不会。原因：
- 语言检测在后台异步进行
- 有 3 秒超时保护
- 同一会话只检测一次
- 页面可以立即渲染，语言稍后切换

### Q4: 用户可以切换语言吗？

**A**: 可以！用户随时可以点击右上角的语言切换按钮（🌐）。
- 用户选择会存储在 `localStorage`
- 系统会尊重用户的选择，不再自动切换

## 隐私说明

- ✅ **不存储 IP 地址**：只获取国家代码，不保存 IP
- ✅ **第三方 API**：使用的是公开的免费 API，符合 GDPR 要求
- ✅ **用户控制**：用户可以随时切换语言，不受限制

## 许可协议

使用的地理位置 API 均为免费服务：
- **ipapi.co**：免费层 1000 次/天
- **ip-api.com**：免费，无限制（有速率限制）

如需更高配额，可以考虑付费方案或切换到其他 API。

