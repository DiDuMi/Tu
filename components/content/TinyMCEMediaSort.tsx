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
      // 获取编辑器中的所有媒体元素，包括本地上传的视频和音频
      const mediaElements = editor.dom.select('img, video, audio, .cloud-video-container, iframe[src*="drive.google.com"], iframe[src*="pcloud"], iframe[src*="mega.nz"], iframe[src*="workers.dev"]')

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
        try {
          console.log('开始应用媒体排序，原始元素数量:', mediaElements.length, '排序后元素数量:', sortedElements.length)

          // 保存当前光标位置
          const bookmark = editor.selection.getBookmark()

          // 记录第一个媒体元素的位置，用于插入排序后的元素
          const firstMediaElement = mediaElements[0]
          const insertionPoint = firstMediaElement?.parentNode || editor.getBody()
          const insertionIndex = firstMediaElement ?
            Array.from(insertionPoint.childNodes).indexOf(firstMediaElement) :
            insertionPoint.childNodes.length

          console.log('插入位置:', insertionIndex, '插入点:', insertionPoint.nodeName)

          // 先收集所有要移除的元素（包括相邻的空段落）
          const elementsToRemove: Node[] = []
          mediaElements.forEach((el: HTMLElement) => {
            elementsToRemove.push(el)

            // 检查元素前后是否有空的段落标签，一并移除
            const nextSibling = el.nextSibling
            const prevSibling = el.previousSibling

            if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
              const nextEl = nextSibling as HTMLElement
              if (nextEl.tagName === 'P' && (!nextEl.textContent || nextEl.textContent.trim() === '')) {
                elementsToRemove.push(nextEl)
              }
            }

            if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
              const prevEl = prevSibling as HTMLElement
              if (prevEl.tagName === 'P' && (!prevEl.textContent || prevEl.textContent.trim() === '')) {
                elementsToRemove.push(prevEl)
              }
            }
          })

          // 移除所有收集到的元素
          elementsToRemove.forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el)
            }
          })

          console.log('已移除元素数量:', elementsToRemove.length)

          // 重新获取插入点，因为DOM结构可能已经改变
          const currentInsertionPoint = editor.getBody()
          let currentInsertionIndex = Math.min(insertionIndex, currentInsertionPoint.childNodes.length)

          // 插入排序后的元素
          sortedElements.forEach((el: HTMLElement, index) => {
            // 克隆元素以避免引用问题
            const clonedElement = el.cloneNode(true) as HTMLElement

            console.log(`插入第${index + 1}个元素:`, clonedElement.tagName, clonedElement.src || clonedElement.outerHTML.substring(0, 50))

            // 创建包装段落
            const wrapper = editor.dom.create('p')
            wrapper.appendChild(clonedElement)

            // 在指定位置插入包装后的元素
            if (currentInsertionIndex < currentInsertionPoint.childNodes.length) {
              currentInsertionPoint.insertBefore(wrapper, currentInsertionPoint.childNodes[currentInsertionIndex])
            } else {
              currentInsertionPoint.appendChild(wrapper)
            }

            // 更新插入索引
            currentInsertionIndex++

            // 在媒体元素之间添加空段落分隔
            if (index < sortedElements.length - 1) {
              const separator = editor.dom.create('p')
              separator.innerHTML = '&nbsp;' // 添加不间断空格确保段落不为空

              if (currentInsertionIndex < currentInsertionPoint.childNodes.length) {
                currentInsertionPoint.insertBefore(separator, currentInsertionPoint.childNodes[currentInsertionIndex])
              } else {
                currentInsertionPoint.appendChild(separator)
              }

              currentInsertionIndex++
            }
          })

          console.log('媒体排序应用完成')

          // 恢复光标位置
          try {
            editor.selection.moveToBookmark(bookmark)
          } catch (error) {
            console.warn('恢复光标位置失败，移动到编辑器末尾:', error)
            // 如果恢复光标位置失败，将光标移到编辑器末尾
            editor.selection.select(editor.getBody(), true)
            editor.selection.collapse(false)
          }

          // 触发内容变化事件，确保编辑器状态同步
          editor.fire('change')

        } catch (error) {
          console.error('应用媒体排序失败:', error)
          editor.notificationManager.open({
            text: '应用媒体排序失败: ' + error.message,
            type: 'error',
          })
        }

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
