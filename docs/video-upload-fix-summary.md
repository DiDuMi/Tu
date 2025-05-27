# 视频上传500错误修复总结

## 🔍 **问题诊断**

### **错误现象**
- 上传视频时提示：`上传失败: 500`
- 服务器日志显示：`FormidableError: options.maxTotalFileSize (104857600 bytes) exceeded, received 104873852 bytes of file data`

### **问题分析**
1. **文件大小超限**: 文件大小104873852字节（约100.02MB）超过了原设置的100MB限制
2. **配置未生效**: 虽然代码中设置了500MB限制，但formidable仍使用旧配置
3. **Next.js配置**: 需要禁用默认的body解析器

## 🛠️ **解决方案**

### **1. 增加文件大小限制**
```typescript
// 从100MB增加到500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
```

### **2. 修复Formidable配置**
```typescript
// 使用更明确的配置方式
const form = new IncomingForm()
form.maxFileSize = MAX_FILE_SIZE
form.maxTotalFileSize = MAX_FILE_SIZE
form.maxFields = 1000
form.maxFieldsSize = 20 * 1024 * 1024
form.keepExtensions = true
form.allowEmptyFiles = false
form.minFileSize = 1
```

### **3. 添加Next.js API配置**
```typescript
export const config = {
  api: {
    bodyParser: false,        // 禁用默认解析器
    responseLimit: '500mb',   // 增加响应限制
    externalResolver: true,   // 使用外部解析器
  },
}
```

### **4. 更新Next.js配置**
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    isrMemoryCacheSize: 0,
  },
  serverRuntimeConfig: {
    maxRequestSize: '500mb'
  },
  // ... 其他配置
}
```

### **5. 改进错误处理**
```typescript
// 更详细的错误信息
if (err.code === 1009 || err.message.includes('maxTotalFileSize')) {
  const maxSizeMB = userGroupMaxFileSize / 1024 / 1024
  reject(new Error(`文件大小超过限制，最大允许 ${maxSizeMB.toFixed(0)}MB`))
} else if (err.code === 1008 || err.message.includes('maxFileSize')) {
  const maxSizeMB = userGroupMaxFileSize / 1024 / 1024
  reject(new Error(`单个文件大小超过限制，最大允许 ${maxSizeMB.toFixed(0)}MB`))
}
```

### **6. 修复React Hydration错误**
```typescript
// 使用useState和useEffect避免SSR/CSR不匹配
const [optimalQuality, setOptimalQuality] = useState<'low' | 'medium' | 'high'>('medium')

useEffect(() => {
  if (typeof window !== 'undefined') {
    setOptimalQuality(getOptimalVideoQuality())
  }
}, [])
```

### **7. 修正用户组上传限制逻辑**
```typescript
// 检查用户组上传限制
let userGroupMaxFileSize = MAX_FILE_SIZE // 默认使用系统限制

if (userGroup?.uploadLimits) {
  const limits = JSON.parse(userGroup.uploadLimits)

  if (limits.maxFileSize) {
    // 将MB转换为字节
    const groupMaxFileSize = limits.maxFileSize * 1024 * 1024
    userGroupMaxFileSize = Math.min(userGroupMaxFileSize, groupMaxFileSize)
  }
}

// 使用用户组的文件大小限制
form.maxFileSize = userGroupMaxFileSize
form.maxTotalFileSize = userGroupMaxFileSize
```

### **8. 强制视频自动压缩**
```typescript
// 智能压缩策略
if (file.size > 200 * 1024 * 1024) { // 200MB以上
  compressionQuality = 20
  maxWidth = 1280
  maxHeight = 720
  preset = 'fast' // 快速预设，减少处理时间
} else if (file.size > 100 * 1024 * 1024) { // 100MB以上
  compressionQuality = 23
  preset = 'medium'
} else {
  // 小文件使用更好的质量
  compressionQuality = 28
  preset = 'slow' // 慢预设，更好的压缩效果
}

// 强制处理所有视频，失败则返回错误
const result = await processVideo(file.filepath, storagePath, {
  quality: compressionQuality,
  preset,
  // ... 其他参数
})

if (!result.success) {
  return errorResponse(res, 'VIDEO_PROCESSING_FAILED',
    '视频处理失败，请尝试使用MP4格式或压缩后重新上传')
}
```

## 📊 **新的上传限制**

### **文件大小限制**
- **最大文件大小**: 500MB (原100MB)
- **推荐文件大小**: 100MB以内
- **单次上传总大小**: 500MB

### **支持的文件格式**
- **视频**: MP4, AVI, MOV, WMV, WebM, FLV, 3GP
- **图片**: JPG, PNG, GIF, WebP
- **音频**: MP3, WAV, AAC, OGG

### **技术限制**
- **最大字段数**: 1000
- **字段大小限制**: 20MB
- **最小文件大小**: 1字节

## 🧪 **测试验证**

### **测试页面**: `/test/upload-test`
- 提供文件选择和上传功能
- 显示文件信息和大小检查
- 实时上传进度和结果显示
- 支持图片、视频、音频预览

### **测试用例**
1. **小文件测试** (< 10MB): ✅ 应该正常上传
2. **中等文件测试** (10-100MB): ✅ 应该正常上传
3. **大文件测试** (100-500MB): ✅ 应该正常上传
4. **超大文件测试** (> 500MB): ❌ 应该显示错误提示

## 🛠️ **视频优化工具**

### **压缩建议脚本**: `scripts/video-upload-optimizer.js`
```bash
# 查看上传限制信息
node scripts/video-upload-optimizer.js --info

# 分析特定视频文件
node scripts/video-upload-optimizer.js /path/to/video.mp4
```

### **FFmpeg压缩命令示例**
```bash
# 高质量压缩 (推荐)
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart output.mp4

# 中等质量压缩
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 128k -movflags +faststart output.mp4

# 低质量压缩 (文件最小)
ffmpeg -i input.mp4 -c:v libx264 -crf 32 -preset fast -c:a aac -b:a 96k -movflags +faststart output.mp4
```

## 📈 **性能监控**

### **日志监控**
- 添加了详细的formidable配置日志
- 记录文件上传的关键信息
- 监控上传成功率和失败原因

### **错误追踪**
- 区分不同类型的上传错误
- 提供具体的错误代码和消息
- 记录文件大小和类型信息

## 🚀 **后续优化建议**

### **短期优化**
1. **监控实际使用**: 观察500MB限制是否足够
2. **性能测试**: 测试大文件上传的服务器性能
3. **用户反馈**: 收集用户对新限制的反馈

### **中期优化**
1. **分块上传**: 实现大文件分块上传功能
2. **进度显示**: 添加详细的上传进度条
3. **断点续传**: 支持上传中断后继续上传

### **长期优化**
1. **云存储集成**: 集成阿里云OSS、腾讯云COS等
2. **CDN加速**: 使用CDN加速文件上传和下载
3. **智能压缩**: 服务端自动压缩和优化

## ✅ **修复验证清单**

- [x] 增加文件大小限制到500MB
- [x] 修复formidable配置问题
- [x] 添加Next.js API配置
- [x] 改进错误处理和提示
- [x] 创建测试页面验证功能
- [x] 添加视频优化工具和建议
- [x] 更新文档和使用指南
- [x] 修复React Hydration错误
- [x] 修正用户组上传限制逻辑
- [x] 强制视频自动压缩功能
- [x] 添加智能压缩策略（根据文件大小）
- [x] 优化FFmpeg预设参数

## 🎯 **总结**

通过以上修复，视频上传功能现在支持：
- **更大的文件**: 最大500MB
- **更好的错误处理**: 详细的错误信息和建议
- **更强的兼容性**: 支持更多视频格式
- **更好的用户体验**: 清晰的限制说明和压缩建议

用户现在可以上传更大的视频文件，同时获得更好的错误提示和优化建议。

---

**修复完成时间**: 2024年12月
**影响范围**: 视频上传功能
**测试状态**: 待验证
**下一步**: 用户测试和反馈收集
