# TinyMCE 表情包功能说明

## 📋 功能概述

TinyMCE编辑器现已集成表情包（emoticons）插件，支持在编辑器中插入和使用各种表情符号。

## 🎯 主要功能

### 1. 工具栏按钮
- 在编辑器工具栏中添加了表情包按钮 😊
- 点击按钮打开表情包选择对话框
- 对话框中按分类显示所有可用表情包

### 2. 自动完成功能
- 输入冒号 `:` 后跟表情名称，如 `:smile`
- 系统会自动显示匹配的表情包建议
- 按回车键或点击选择表情包

### 3. 搜索功能
- 在表情包对话框中支持关键词搜索
- 支持中文和英文关键词
- 实时过滤显示匹配的表情包

### 4. 自定义表情包
- 预设了常用的自定义表情包
- 支持中文关键词搜索
- 可以通过配置添加更多自定义表情

## 🔧 技术实现

### 插件配置
```typescript
// 在 TinyMCEConfig.ts 中添加
export const tinyMCEPlugins = [
  // ... 其他插件
  'emoticons'
]

// 工具栏配置
export const tinyMCEToolbar = 
  '... | image media emoticons | ...'
```

### 编辑器配置
```typescript
// 在 TinyMCEEditor.tsx 中配置
{
  emoticons_database: 'emojis', // 使用Unicode字符
  emoticons_append: {
    // 自定义表情包配置
    custom_thumbs_up: {
      keywords: ['赞', '好', '棒', 'good', 'thumbs', 'up'],
      char: '👍',
      category: 'people'
    },
    // ... 更多自定义表情
  }
}
```

## 📝 预设自定义表情包

| 表情 | 名称 | 中文关键词 | 英文关键词 | 分类 |
|------|------|------------|------------|------|
| 👍 | custom_thumbs_up | 赞, 好, 棒 | good, thumbs, up | people |
| ❤️ | custom_heart | 爱, 心 | love, heart | symbols |
| 🔥 | custom_fire | 火, 热 | fire, hot | objects |
| 🚀 | custom_rocket | 火箭, 快 | rocket, fast | travel_and_places |
| ⭐ | custom_star | 星, 棒 | star, awesome | symbols |

## 🎮 使用方法

### 方法一：工具栏按钮
1. 点击编辑器工具栏中的表情包按钮
2. 在弹出的对话框中浏览或搜索表情包
3. 点击选择要插入的表情包

### 方法二：自动完成
1. 在编辑器中输入冒号 `:`
2. 继续输入表情名称，如 `smile`
3. 从弹出的建议中选择表情包
4. 按回车键确认插入

### 方法三：关键词搜索
1. 打开表情包对话框
2. 在搜索框中输入关键词
3. 支持中文搜索，如"笑"、"爱"、"火"等
4. 点击匹配的表情包插入

## 🔍 测试页面

访问 `/test-emoticons` 页面可以测试表情包功能：
- 完整的功能演示
- 使用方法说明
- 预设表情包列表
- 实时测试环境

## ⚙️ 配置选项

### emoticons_database
- `'emojis'`: 使用Unicode字符（默认）
- `'emojiimages'`: 使用图片表情包

### emoticons_append
- 添加自定义表情包
- 支持关键词和分类配置
- 可以覆盖默认表情包

### emoticons_images_url
- 当使用图片表情包时的图片路径
- 默认使用Twemoji CDN

## 🌟 优势特点

1. **跨平台兼容**: 使用Unicode字符确保在所有设备上正确显示
2. **中文支持**: 支持中文关键词搜索，更适合中文用户
3. **自定义扩展**: 可以轻松添加自定义表情包
4. **用户友好**: 多种插入方式，操作简单直观
5. **性能优化**: 按需加载，不影响编辑器性能

## 🔮 未来扩展

1. **更多预设表情**: 可以添加更多常用的中文表情包
2. **表情包分组**: 按使用频率或主题分组
3. **最近使用**: 记录用户最近使用的表情包
4. **自定义上传**: 支持用户上传自定义表情图片
5. **快捷键支持**: 为常用表情包设置快捷键

## 📚 相关文档

- [TinyMCE Emoticons Plugin 官方文档](https://www.tiny.cloud/docs/tinymce/latest/emoticons/)
- [Unicode Emoji 标准](https://unicode.org/emoji/)
- [Twemoji 项目](https://github.com/jdecked/twemoji)
