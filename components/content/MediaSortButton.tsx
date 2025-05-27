import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@/components/ui/Button'
import MediaSortDialog from './MediaSortDialog'

interface MediaSortButtonProps {
  editorRef: any
  disabled?: boolean
  className?: string
}

const MediaSortButton: React.FC<MediaSortButtonProps> = ({
  editorRef,
  disabled = false,
  className = ''
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleMediaSort = () => {
    if (!editorRef || !editorRef.current) {
      console.warn('编辑器引用不可用')
      return
    }

    const editor = editorRef.current
    setIsProcessing(true)

    try {
      // 获取编辑器中的所有媒体元素，包括本地上传的视频和音频
      const mediaElements = editor.dom.select('img, video, audio, .cloud-video-container, iframe[src*="drive.google.com"], iframe[src*="pcloud"], iframe[src*="mega.nz"], iframe[src*="workers.dev"]')

      if (mediaElements.length === 0) {
        editor.notificationManager.open({
          text: '没有找到媒体元素',
          type: 'info',
        })
        setIsProcessing(false)
        return
      }

      // 创建对话框容器
      const dialogContainer = document.createElement('div')
      document.body.appendChild(dialogContainer)
      const root = createRoot(dialogContainer)

      // 应用排序的回调函数
      const handleApply = (sortedElementsData: Array<{html: string, tagName: string, type: string}>) => {
        try {
          console.log('开始应用媒体排序，原始元素数量:', mediaElements.length, '排序后元素数量:', sortedElementsData.length)

          // 保存当前光标位置
          const bookmark = editor.selection.getBookmark()

          // 记录第一个媒体元素的位置，用于插入排序后的元素
          const firstMediaElement = mediaElements[0]
          const insertionPoint = firstMediaElement?.parentNode || editor.getBody()
          const insertionIndex = firstMediaElement ?
            Array.from(insertionPoint.childNodes).indexOf(firstMediaElement) :
            insertionPoint.childNodes.length

          console.log('插入位置:', insertionIndex, '插入点:', insertionPoint.nodeName)

          // 移除所有原始媒体元素
          mediaElements.forEach((el: HTMLElement) => {
            if (el.parentNode) {
              el.parentNode.removeChild(el)
            }
          })

          console.log('已移除原始媒体元素数量:', mediaElements.length)

          // 重新获取插入点，因为DOM结构可能已经改变
          const currentInsertionPoint = editor.getBody()
          let currentInsertionIndex = Math.min(insertionIndex, currentInsertionPoint.childNodes.length)

          // 使用insertContent插入排序后的元素，但一次性插入所有内容
          const allMediaHtml = sortedElementsData.map(data => data.html).join('<p></p>')

          // 在指定位置插入内容
          if (currentInsertionIndex === 0) {
            // 在开头插入
            editor.selection.select(editor.getBody(), true)
            editor.selection.collapse(true)
            editor.insertContent(allMediaHtml + '<p></p>')
          } else if (currentInsertionIndex >= currentInsertionPoint.childNodes.length) {
            // 在末尾插入
            editor.selection.select(editor.getBody(), true)
            editor.selection.collapse(false)
            editor.insertContent('<p></p>' + allMediaHtml)
          } else {
            // 在中间插入
            const targetNode = currentInsertionPoint.childNodes[currentInsertionIndex]
            editor.selection.select(targetNode, true)
            editor.selection.collapse(true)
            editor.insertContent(allMediaHtml + '<p></p>')
          }

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
        setIsProcessing(false)
      }

      // 取消的回调函数
      const handleCancel = () => {
        root.unmount()
        document.body.removeChild(dialogContainer)
        setIsProcessing(false)
      }

      // 渲染React组件
      root.render(
        React.createElement(MediaSortDialog, {
          mediaElements,
          onApply: handleApply,
          onCancel: handleCancel,
        })
      )
    } catch (error) {
      console.error('媒体排序失败:', error)
      setIsProcessing(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleMediaSort}
      disabled={disabled || isProcessing}
      className={`flex items-center gap-2 ${className}`}
      title="对媒体进行排序"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
      {isProcessing ? '处理中...' : '媒体排序'}
    </Button>
  )
}

export default MediaSortButton
