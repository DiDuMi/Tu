import { Editor } from '@tinymce/tinymce-react'
import React, { useRef, useEffect, useState } from 'react'

import { applyExtendedTranslations } from '@/lib/tinymce-i18n'

import BatchUploadDialog from './BatchUploadDialog'
import {
  tinyMCEPlugins,
  tinyMCEToolbar,
  tinyMCEContentStyle,
  setupCustomButtons,
  setupPasteHandler
} from './TinyMCEConfig'
import { setupMediaSortButton } from './TinyMCEMediaSort'

// 确保TinyMCE编辑器加载中文语言包
const TINYMCE_SCRIPT_SRC = [
  'https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js',
  'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.7.24/langs/zh_CN.js'
]

interface TinyMCEEditorProps {
  value: string
  onChange: (content: string) => void
  height?: number
  placeholder?: string
  disabled?: boolean
  onInit?: (editor: any) => void
}

const TinyMCEEditor: React.FC<TinyMCEEditorProps> = ({
  value,
  onChange,
  height = 500,
  placeholder = '请输入内容...',
  disabled = false,
  onInit
}) => {
  const editorRef = useRef<any>(null)
  const [showBatchUpload, setShowBatchUpload] = useState(false)
  const [draggedFiles, setDraggedFiles] = useState<File[]>([])



  // 处理批量上传完成
  const handleUploadComplete = (mediaList: any[]) => {
    if (editorRef.current && mediaList.length > 0) {
      console.log('批量上传完成，插入媒体:', mediaList)

      // 确保编辑器获得焦点
      editorRef.current.focus()

      // 去重处理：基于URL去重，避免重复插入相同的媒体
      const uniqueMedia = mediaList.filter((media, index, array) => {
        return array.findIndex(m => m.url === media.url) === index
      })

      console.log('去重后的媒体列表:', uniqueMedia)

      // 进一步检查：避免插入已经存在于编辑器中的媒体
      const currentContent = editorRef.current.getContent()
      const finalMediaList = uniqueMedia.filter(media => {
        const normalizedUrl = media.url.replace(/\\/g, '/')
        // 检查当前内容中是否已经包含这个URL
        const urlExists = currentContent.includes(normalizedUrl) || currentContent.includes(media.url)
        if (urlExists) {
          console.log('跳过已存在的媒体:', normalizedUrl)
          return false
        }
        return true
      })

      console.log('最终要插入的媒体列表:', finalMediaList)

      if (finalMediaList.length === 0) {
        console.log('没有新的媒体需要插入')
        editorRef.current.notificationManager.open({
          text: '所有媒体文件已存在于编辑器中',
          type: 'info',
          timeout: 3000,
        })
        setShowBatchUpload(false)
        return
      }

      // 生成媒体HTML并插入编辑器
      const mediaHtml = finalMediaList.map(media => {
        // 确保URL使用正斜杠格式
        const normalizedUrl = media.url.replace(/\\/g, '/')
        console.log('处理媒体:', { type: media.type, url: normalizedUrl, title: media.title })

        if (media.type === 'IMAGE') {
          return `<p><img src="${normalizedUrl}" alt="${media.title || '图片'}" style="max-width: 100%; height: auto;" /></p>`
        } else if (media.type === 'VIDEO') {
          // 改进视频HTML生成，确保正确的格式和MIME类型
          const videoMimeType = media.mimeType || 'video/mp4'
          console.log('生成视频HTML:', { url: normalizedUrl, mimeType: videoMimeType })

          return `<p><video controls style="max-width: 100%; height: auto;" preload="metadata">
            <source src="${normalizedUrl}" type="${videoMimeType}">
            您的浏览器不支持视频播放。<a href="${normalizedUrl}" target="_blank">点击下载视频</a>
          </video></p>`
        } else if (media.type === 'AUDIO') {
          return `<p><audio controls style="width: 100%;">
            <source src="${normalizedUrl}" type="${media.mimeType || 'audio/mp3'}">
            您的浏览器不支持音频播放。<a href="${normalizedUrl}" target="_blank">点击下载音频</a>
          </audio></p>`
        }
        return `<p><a href="${normalizedUrl}" target="_blank">${media.title || media.url}</a></p>`
      }).join('')

      console.log('生成的HTML:', mediaHtml)

      // 安全地插入内容到光标位置
      try {
        // 如果有选中的内容，在选中内容后插入
        const selection = editorRef.current.selection
        if (selection && !selection.isCollapsed()) {
          // 有选中内容，移动光标到选中内容的末尾
          selection.collapse(false)
        }

        // 插入媒体内容
        editorRef.current.insertContent(mediaHtml)

        // 确保光标移动到插入内容的末尾
        const range = editorRef.current.selection.getRng()
        range.collapse(false)
        editorRef.current.selection.setRng(range)

      } catch (error) {
        console.error('插入内容时出错:', error)
        // 降级方案：在内容末尾添加
        const newContent = currentContent + '\n' + mediaHtml
        editorRef.current.setContent(newContent)
      }

      // 触发内容变化事件，确保父组件能获取到更新的内容
      if (onChange) {
        const updatedContent = editorRef.current.getContent()
        console.log('更新后的编辑器内容:', updatedContent)
        onChange(updatedContent)
      }

      // 显示成功通知
      editorRef.current.notificationManager.open({
        text: `成功插入 ${finalMediaList.length} 个媒体文件`,
        type: 'success',
        timeout: 3000,
      })
    }

    setShowBatchUpload(false)
  }



  // 监听批量上传事件
  useEffect(() => {
    const handleOpenBatchUpload = (event: CustomEvent) => {
      console.log('收到批量上传事件:', event.detail)
      const files = event.detail?.files || []
      setDraggedFiles(files)
      setShowBatchUpload(true)
    }

    // 添加事件监听器
    window.addEventListener('openBatchUpload', handleOpenBatchUpload as EventListener)

    // 清理函数
    return () => {
      window.removeEventListener('openBatchUpload', handleOpenBatchUpload as EventListener)
    }
  }, [])

  // 确保中文语言包已加载并应用扩展翻译
  useEffect(() => {
    // 检查语言包是否存在
    const checkLanguageFile = async () => {
      try {
        const response = await fetch('/langs/zh_CN.js')
        if (!response.ok) {
          console.warn('TinyMCE中文语言包未找到，将使用默认英文界面')

          // 尝试从CDN加载中文语言包
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.7.24/langs/zh_CN.js'
          script.async = true
          document.body.appendChild(script)

          script.onload = () => {
            console.log('已从CDN加载TinyMCE中文语言包')
            // 应用扩展翻译
            setTimeout(() => {
              applyExtendedTranslations()
            }, 100)
          }

          script.onerror = () => {
            console.error('从CDN加载TinyMCE中文语言包失败')
          }
        } else {
          // 本地语言包存在，应用扩展翻译
          setTimeout(() => {
            applyExtendedTranslations()
          }, 100)
        }
      } catch (error) {
        console.warn('检查TinyMCE语言包时出错:', error)
      }
    }

    checkLanguageFile()
  }, [])

  return (
    <>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ""}
        onInit={(_evt: any, editor: any) => {
          editorRef.current = editor
          if (onInit) {
            onInit(editor)
          }
        }}
        value={value}
        onEditorChange={onChange}
        disabled={disabled}
        tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
        init={{
        height,
        menubar: true,
        language: 'zh_CN',
        // 使用本地语言包确保完整汉化
        language_url: '/langs/zh_CN.js',
        plugins: tinyMCEPlugins,
        toolbar: tinyMCEToolbar,
        content_style: tinyMCEContentStyle,
        placeholder,
        branding: false,
        convert_urls: false,
        entity_encoding: 'raw',
        // 允许所有HTML元素和属性
        valid_elements: '*[*]',
        valid_children: '*[*]',
        // 禁用内置的图片上传处理器，统一使用批量上传
        images_upload_handler: () => {
          console.log('内置图片上传被禁用，请使用批量上传功能')
          return Promise.reject('请使用批量上传功能')
        },
        // 禁用文件拖拽上传到编辑器，统一使用批量上传
        paste_data_images: false,
        // 禁用文件选择器，统一使用批量上传
        file_picker_types: '',
        file_picker_callback: undefined,
        setup: (editor: any) => {
          // 设置自定义按钮
          setupCustomButtons(editor)
          // 设置媒体排序按钮
          setupMediaSortButton(editor)
          // 设置粘贴事件处理
          setupPasteHandler(editor)

          // 设置拖拽上传处理
          let dropPosition: any = null

          editor.on('dragover dragenter', (e: any) => {
            e.preventDefault()
            e.stopPropagation()

            // 记录拖拽位置
            const range = editor.selection.getRng()
            dropPosition = {
              startContainer: range.startContainer,
              startOffset: range.startOffset,
              endContainer: range.endContainer,
              endOffset: range.endOffset
            }
          })

          editor.on('drop', (e: any) => {
            e.preventDefault()
            e.stopPropagation()

            const files = Array.from(e.dataTransfer?.files || [])
            if (files.length > 0) {
              // 设置光标到拖拽位置
              if (dropPosition) {
                try {
                  const range = editor.dom.createRng()
                  range.setStart(dropPosition.startContainer, dropPosition.startOffset)
                  range.setEnd(dropPosition.endContainer, dropPosition.endOffset)
                  editor.selection.setRng(range)
                } catch (error) {
                  console.warn('设置拖拽位置失败:', error)
                }
              }

              // 触发批量上传
              const event = new CustomEvent('openBatchUpload', {
                detail: { files }
              })
              window.dispatchEvent(event)
            }
          })
        },
        // 添加性能优化选项
        cache_suffix: '?v=1',
        min_height: 300,
        resize: true,
        statusbar: true,
        // 添加自动保存功能
        autosave_interval: '30s',
        autosave_prefix: 'tinymce-autosave-{path}-{id}-',
        autosave_restore_when_empty: true,
        // 菜单配置 - 移除 image media 项，统一使用批量上传
        menu: {
          insert: { title: '插入', items: 'emoticons | link | insertdatetime' },
          format: { title: '格式', items: 'bold italic underline strikethrough superscript subscript | formats | removeformat' },
          tools: { title: '工具', items: 'code wordcount' },
          view: { title: '查看', items: 'visualaid visualblocks visualchars | preview fullscreen' },
          help: { title: '帮助', items: 'help' }
        },
        // 表情包配置
        emoticons_database: 'emojis', // 使用Unicode字符表情
        emoticons_append: {
          // 添加一些常用的自定义表情
          custom_thumbs_up: {
            keywords: ['赞', '好', '棒', 'good', 'thumbs', 'up'],
            char: '👍',
            category: 'people'
          },
          custom_heart: {
            keywords: ['爱', '心', 'love', 'heart'],
            char: '❤️',
            category: 'symbols'
          },
          custom_fire: {
            keywords: ['火', '热', 'fire', 'hot'],
            char: '🔥',
            category: 'objects'
          },
          custom_rocket: {
            keywords: ['火箭', '快', 'rocket', 'fast'],
            char: '🚀',
            category: 'travel_and_places'
          },
          custom_star: {
            keywords: ['星', '棒', 'star', 'awesome'],
            char: '⭐',
            category: 'symbols'
          }
        },
      }}
    />

    {/* 批量上传对话框 */}
    <BatchUploadDialog
      isOpen={showBatchUpload}
      onClose={() => {
        setShowBatchUpload(false)
        setDraggedFiles([])
      }}
      onUploadComplete={handleUploadComplete}
      initialFiles={draggedFiles}
    />
    </>
  )
}

export default TinyMCEEditor
