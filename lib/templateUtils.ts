/**
 * 模板相关的工具函数
 */

// 获取模板类型标签
export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'HEADER': return '页头'
    case 'FOOTER': return '页尾'
    case 'GENERAL': return '通用'
    default: return type
  }
}

// 获取模板类型颜色
export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'HEADER': return 'bg-blue-100 text-blue-800'
    case 'FOOTER': return 'bg-green-100 text-green-800'
    case 'GENERAL': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// 截取内容预览
export const getContentPreview = (content: string, maxLength = 100): string => {
  const textContent = content.replace(/<[^>]*>/g, '').trim()
  return textContent.length > maxLength
    ? textContent.substring(0, maxLength) + '...'
    : textContent
}

// 删除模板
export const deleteTemplate = async (templateId: number): Promise<void> => {
  const response = await fetch(`/api/v1/content-templates/${templateId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || '删除失败')
  }
}

// 使用模板（记录使用次数）
export const useTemplate = async (templateId: number): Promise<void> => {
  try {
    await fetch(`/api/v1/content-templates/${templateId}/use`, {
      method: 'POST'
    })
  } catch (error) {
    console.error('Use template error:', error)
    // 即使记录失败也不抛出错误，允许继续使用模板
  }
}
