/**
 * TinyMCE媒体排序功能
 */
import { createRoot } from 'react-dom/client'
import React from 'react'
import MediaSortDialog from './MediaSortDialog'

// 添加媒体排序按钮
export const setupMediaSortButton = (editor: any) => {
  editor.ui.registry.addButton('mediasort', {
    text: '媒体排序',
    tooltip: '对媒体进行排序',
    onAction: () => {
      // 获取编辑器中的所有媒体元素，包括直接的iframe
      const mediaElements = editor.dom.select('img, .cloud-video-container, iframe[src*="drive.google.com"], iframe[src*="pcloud"], iframe[src*="mega.nz"], iframe[src*="workers.dev"]')

      if (mediaElements.length === 0) {
        editor.notificationManager.open({
          text: '没有找到媒体元素',
          type: 'info',
        })
        return
      }

      // 创建对话框容器
      const dialogContainer = document.createElement('div')
      document.body.appendChild(dialogContainer)
      const root = createRoot(dialogContainer)

      // 应用排序的回调函数
      const handleApply = (sortedElements: HTMLElement[]) => {
        // 从编辑器中移除所有媒体元素
        mediaElements.forEach((el: HTMLElement) => {
          editor.dom.remove(el)
        })

        // 将排序后的媒体元素重新插入编辑器
        const bookmark = editor.selection.getBookmark()

        // 在编辑器末尾插入所有媒体元素
        editor.selection.select(editor.getBody(), true)
        editor.selection.collapse(false)

        sortedElements.forEach((el: HTMLElement) => {
          editor.insertContent(editor.dom.getOuterHTML(el) + '<p></p>')
        })

        editor.selection.moveToBookmark(bookmark)

        // 清理对话框
        root.unmount()
        document.body.removeChild(dialogContainer)
      }

      // 取消的回调函数
      const handleCancel = () => {
        root.unmount()
        document.body.removeChild(dialogContainer)
      }

      // 渲染React组件
      root.render(
        React.createElement(MediaSortDialog, {
          mediaElements,
          onApply: handleApply,
          onCancel: handleCancel,
        })
      )
    },
  })
}
