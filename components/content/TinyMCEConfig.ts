/**
 * TinyMCE编辑器配置
 */

// 基础插件配置
export const tinyMCEPlugins = [
  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons'
]

// 工具栏配置 - 移除内置的 image media 按钮，避免与批量上传冲突
export const tinyMCEToolbar = 'undo redo | formatselect | ' +
  'bold italic backcolor | alignleft aligncenter ' +
  'alignright alignjustify | bullist numlist outdent indent | ' +
  'removeformat | help | emoticons'

// 内容样式
export const tinyMCEContentStyle = `
  body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }
  img { max-width: 100%; height: auto; }
  .cloud-video-container { display: block; margin: 0 auto; width: 100%; }
  .cloud-video-container iframe { width: 100%; height: 480px; border: 0; display: block; }
`

// 图片上传处理函数
export const createImageUploadHandler = async (blobInfo: any, _progress: any) => {
  try {
    const formData = new FormData()
    formData.append('file', blobInfo.blob(), blobInfo.filename())

    const response = await fetch('/api/v1/media/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error?.message || '上传失败')
    }

    return result.data.url
  } catch (error) {
    console.error('图片上传失败:', error)
    throw new Error('图片上传失败')
  }
}

// 自定义按钮配置
export const setupCustomButtons = (editor: any) => {
  // 添加媒体处理按钮
  editor.ui.registry.addButton('processmedia', {
    text: '媒体处理',
    tooltip: '处理图片和视频媒体',
    onAction: () => {
      // 打开媒体处理对话框
      editor.windowManager.open({
        title: '媒体处理',
        body: {
          type: 'panel',
          items: [
            {
              type: 'input',
              name: 'alt',
              label: '替代文本',
            },
            {
              type: 'input',
              name: 'width',
              label: '宽度',
            },
            {
              type: 'input',
              name: 'height',
              label: '高度',
            },
          ],
        },
        buttons: [
          {
            type: 'cancel',
            text: '取消',
          },
          {
            type: 'submit',
            text: '确定',
            primary: true,
          },
        ],
        onSubmit: (api: any) => {
          const data = api.getData()
          const selectedNode = editor.selection.getNode()

          if (selectedNode.nodeName === 'IMG') {
            if (data.alt) {
              editor.dom.setAttrib(selectedNode, 'alt', data.alt)
            }
            if (data.width) {
              editor.dom.setAttrib(selectedNode, 'width', data.width)
            }
            if (data.height) {
              editor.dom.setAttrib(selectedNode, 'height', data.height)
            }
          }

          api.close()
        },
      })
    },
  })

  // 添加批量上传按钮
  editor.ui.registry.addButton('batchupload', {
    text: '批量上传',
    tooltip: '批量上传图片和视频',
    onAction: () => {
      // 触发自定义事件，让React组件处理
      const event = new CustomEvent('openBatchUpload', {
        detail: { editor }
      })
      window.dispatchEvent(event)
    }
  })
}

/**
 * 设置粘贴事件处理 - 专注于本地媒体上传
 */
export const setupPasteHandler = (editor: any) => {
  editor.on('paste', (e: any) => {
    // 移除云媒体粘贴处理，保留默认粘贴行为
    // 用户可以通过批量上传功能上传本地媒体文件
  })
}
