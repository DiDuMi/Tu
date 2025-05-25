# 媒体文件处理指南

## 📋 概述

本指南提供了项目中媒体文件处理的完整解决方案，包括文件名安全性处理、视频播放问题修复和预防措施。

## 🔧 工具和脚本

### 1. 文件名处理工具 (`lib/filename-utils.ts`)

提供了一套完整的文件名处理函数：

- `sanitizeFilename()` - 清理文件名，移除不安全字符
- `validateFilename()` - 验证文件名安全性
- `generateUniqueFilename()` - 生成唯一的安全文件名
- `getSafeMediaUrl()` - 生成安全的媒体URL
- `monitorFileUpload()` - 监控文件上传，记录问题

### 2. 媒体文件修复脚本 (`scripts/fix-media-filenames.ts`)

批量修复数据库中包含特殊字符的媒体文件：

```bash
# 预览模式（不实际修改文件）
npm run media:fix:dry-run

# 执行修复
npm run media:fix

# 生成详细报告
npm run media:fix:report
```

### 3. 测试套件 (`__tests__/filename-utils.test.ts`)

完整的单元测试覆盖：

```bash
# 运行测试
npm test

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 🚀 快速开始

### 1. 检查现有问题

首先运行预览模式检查是否有问题文件：

```bash
npm run media:fix:dry-run
```

### 2. 修复问题文件

如果发现问题文件，运行修复脚本：

```bash
npm run media:fix
```

### 3. 验证修复结果

生成详细报告验证修复结果：

```bash
npm run media:fix:report
```

## 📁 文件名规范

### ✅ 安全的文件名格式

```
{timestamp}_{user_id}_{random}_{safe_name}.{extension}
```

**示例**：
- `1748133483595_1_abc123_video_content.mp4`
- `1748133483595_1_def456_image_001.jpg`

### ❌ 避免的字符

- Emoji表情符号：🔗🎈🎬
- 中文字符：测试文件
- 特殊符号：@#$%^&*()
- 空格和其他不安全字符

### 🔧 自动处理

上传组件现在会自动：
1. 验证文件名安全性
2. 对高风险文件名返回错误
3. 生成安全的唯一文件名
4. 监控和记录问题文件

## 🎬 视频播放修复

### 问题根因

视频无法播放的主要原因是文件名包含URL不安全字符，导致浏览器无法正确解析路径。

### 解决方案

1. **URL编码处理**：视频组件现在自动对URL进行安全编码
2. **错误降级**：如果编码URL失败，自动降级到原始URL
3. **错误监控**：记录播放失败的详细信息

### 验证修复

访问包含特殊字符文件名的视频页面，确认能够正常播放。

## 🧪 测试

### 运行所有测试

```bash
npm test
```

### 测试特定功能

```bash
# 只测试文件名处理
npm test filename-utils

# 监视模式
npm run test:watch
```

### 覆盖率报告

```bash
npm run test:coverage
```

目标覆盖率：70%以上

## 📊 监控和维护

### 1. 文件上传监控

系统会自动监控文件上传，记录问题文件名：

```javascript
// 在控制台查看监控日志
console.log('检测到问题文件名:', {
  filename: '问题文件.mp4',
  issues: ['包含中文字符'],
  severity: 'medium'
})
```

### 2. 定期检查

建议每月运行一次检查脚本：

```bash
npm run media:fix:dry-run
```

### 3. 性能监控

监控视频播放失败率和文件访问错误。

## 🔍 故障排除

### 视频仍然无法播放

1. **检查文件是否存在**：
   ```bash
   ls -la public/uploads/media/path/to/file.mp4
   ```

2. **检查文件权限**：
   ```bash
   chmod 644 public/uploads/media/path/to/file.mp4
   ```

3. **检查MIME类型**：
   ```bash
   file --mime-type public/uploads/media/path/to/file.mp4
   ```

### 修复脚本失败

1. **检查数据库连接**
2. **确保有足够的磁盘空间**
3. **检查文件权限**

### 测试失败

1. **更新依赖**：
   ```bash
   npm install
   ```

2. **清理缓存**：
   ```bash
   npm test -- --clearCache
   ```

## 📚 相关文档

- [媒体文件处理技术文档](./项目文档/媒体文件处理技术文档.md)
- [API文档](./项目文档/API文档.md)
- [部署指南](./项目文档/部署指南.md)

## 🤝 贡献指南

### 添加新功能

1. 编写测试用例
2. 实现功能
3. 更新文档
4. 提交PR

### 报告问题

请在GitHub Issues中报告问题，包含：
- 问题描述
- 重现步骤
- 错误日志
- 环境信息

---

**维护者**：开发团队  
**最后更新**：2025年1月25日
