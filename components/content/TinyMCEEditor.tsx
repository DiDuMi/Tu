import React, { useRef, useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import {
  tinyMCEPlugins,
  tinyMCEToolbar,
  tinyMCEContentStyle,
  createImageUploadHandler,
  setupCustomButtons,
  setupPasteHandler
} from './TinyMCEConfig'
import { setupMediaSortButton } from './TinyMCEMediaSort'
import { applyExtendedTranslations } from '@/lib/tinymce-i18n'
import BatchUploadDialog from './BatchUploadDialog'

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

  // 监听批量上传事件
  useEffect(() => {
    const handleBatchUpload = (event: CustomEvent) => {
      const { files } = event.detail
      if (files && files.length > 0) {
        setDraggedFiles(files)
      }
      setShowBatchUpload(true)
    }

    window.addEventListener('openBatchUpload', handleBatchUpload as EventListener)

    return () => {
      window.removeEventListener('openBatchUpload', handleBatchUpload as EventListener)
    }
  }, [])

  // 处理批量上传完成
  const handleUploadComplete = (mediaList: any[]) => {
    if (editorRef.current && mediaList.length > 0) {
      console.log('批量上传完成，插入媒体:', mediaList)

      // 生成媒体HTML并插入编辑器
      const mediaHtml = mediaList.map(media => {
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

      // 插入到编辑器
      editorRef.current.insertContent(mediaHtml)

      // 触发内容变化事件，确保父组件能获取到更新的内容
      if (onChange) {
        const updatedContent = editorRef.current.getContent()
        console.log('更新后的编辑器内容:', updatedContent)
        onChange(updatedContent)
      }

      // 显示成功通知
      editorRef.current.notificationManager.open({
        text: `成功插入 ${mediaList.length} 个媒体文件`,
        type: 'success',
        timeout: 3000,
      })
    }

    setShowBatchUpload(false)
  }

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
        images_upload_handler: createImageUploadHandler,
        // 启用文件拖拽上传
        paste_data_images: true,
        file_picker_types: 'image media',
        // 自定义文件选择器
        file_picker_callback: (_callback: any, _value: any, meta: any) => {
          // 创建文件输入元素
          const input = document.createElement('input')
          input.setAttribute('type', 'file')

          if (meta.filetype === 'image') {
            input.setAttribute('accept', 'image/*')
          } else if (meta.filetype === 'media') {
            input.setAttribute('accept', 'video/*,audio/*')
          }

          input.onchange = function() {
            const file = (this as HTMLInputElement).files?.[0]
            if (file) {
              // 使用批量上传处理
              const event = new CustomEvent('openBatchUpload', {
                detail: { files: [file] }
              })
              window.dispatchEvent(event)
            }
          }

          input.click()
        },
        setup: (editor: any) => {
          // 设置自定义按钮
          setupCustomButtons(editor)
          // 设置媒体排序按钮
          setupMediaSortButton(editor)
          // 设置粘贴事件处理
          setupPasteHandler(editor)

          // 设置拖拽上传处理
          editor.on('dragover dragenter', (e: any) => {
            e.preventDefault()
            e.stopPropagation()
          })

          editor.on('drop', (e: any) => {
            e.preventDefault()
            e.stopPropagation()

            const files = Array.from(e.dataTransfer?.files || [])
            if (files.length > 0) {
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
        // 菜单配置
        menu: {
          insert: { title: '插入', items: 'image media emoticons | link | insertdatetime' },
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
