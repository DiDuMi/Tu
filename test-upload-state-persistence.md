# 上传状态持久化测试

## 问题描述
拖拽媒体到"批量上传媒体"后点击"开始上传"，再点击"最小化"后打开"批量上传媒体"，会发现原来上传的文件消失了。

## 根本原因
1. **组件重新挂载**: 最小化时 `EnhancedBatchUpload` 组件被卸载，恢复时重新挂载导致内部状态丢失
2. **状态管理分离**: `UploadManager` 没有管理上传文件的状态，状态都在子组件内部
3. **缺少状态同步**: 父子组件之间没有状态同步机制

## 解决方案

### 1. 修改渲染策略
- **之前**: 使用条件渲染 `{condition && <Component />}` 导致组件挂载/卸载
- **现在**: 使用样式控制显示/隐藏 `<div style={{display: condition ? 'block' : 'none'}}>`

### 2. 添加状态同步
- 在 `EnhancedBatchUpload` 中添加 `onStatsUpdate` 回调
- 实时同步上传统计信息到 `UploadManager`
- 使用 `useEffect` 监听状态变化并同步

### 3. 使用 forwardRef
- 将 `EnhancedBatchUpload` 改为 `forwardRef` 组件
- 使用 `useImperativeHandle` 暴露组件方法
- 父组件可以通过 ref 访问子组件状态和方法

## 测试步骤

### 测试场景 1: 基本上传状态持久化
1. 打开批量上传组件
2. 拖拽几个文件到上传区域
3. 点击"开始上传"
4. 在上传过程中点击"最小化"
5. 点击悬浮窗的"展开"按钮
6. **预期结果**: 文件列表和上传进度应该保持不变

### 测试场景 2: 最小化窗口状态同步
1. 上传多个文件
2. 点击"最小化"
3. **预期结果**: 悬浮窗显示正确的文件数量和进度统计

### 测试场景 3: 页面离开提醒
1. 开始上传文件
2. 尝试刷新页面或关闭浏览器
3. **预期结果**: 显示离开确认提示

## 技术实现细节

### UploadManager 组件
```typescript
// 使用样式控制显示/隐藏，避免组件卸载
<div style={{ display: (isOpen && !isMinimized) ? 'block' : 'none' }}>
  <EnhancedBatchUpload
    ref={uploadComponentRef}
    onStatsUpdate={handleStatsUpdate}
    // ... 其他props
  />
</div>
```

### EnhancedBatchUpload 组件
```typescript
// 状态同步
useEffect(() => {
  if (onStatsUpdate) {
    onStatsUpdate({
      uploadCount: uploadItems.length,
      completedCount: completedItems.length,
      failedCount: failedItems.length,
      isUploading: hasActiveUploads
    })
  }
}, [uploadItems, onStatsUpdate])

// 暴露方法给父组件
useImperativeHandle(ref, () => ({
  getUploadStats: () => ({ /* 统计信息 */ }),
  getUploadItems: () => uploadItems,
  clearCompleted: () => { /* 清理已完成项目 */ }
}), [uploadItems, hasActiveUploads])
```

## 验证结果
修复后，上传状态在最小化/恢复过程中应该完全保持，用户体验得到显著改善。
