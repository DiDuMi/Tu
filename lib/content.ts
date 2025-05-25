/**
 * 内容管理相关工具函数
 */

/**
 * 从标题中提取标签
 * 格式：标题 #标签1 #标签2
 * @param title 包含标签的标题
 * @returns 处理后的标题和标签数组
 */
export function extractTagsFromTitle(title: string): {
  displayTitle: string,
  originalTitle: string,
  tags: string[]
} {
  // 保存原始标题
  const originalTitle = title;

  // 匹配标题中的标签，格式为 #标签
  const tagRegex = /#([^\s#]+)/g
  const tags: string[] = []
  let match

  // 提取所有标签
  while ((match = tagRegex.exec(title)) !== null) {
    tags.push(match[1])
  }

  // 移除标题中的#符号，但保留标签文本
  let displayTitle = title.replace(/#/g, '').trim()

  // 清理多余的空格
  displayTitle = displayTitle.replace(/\s+/g, ' ')

  // 清理开头和结尾的连字符和空格
  displayTitle = displayTitle.replace(/^[\s\-]+|[\s\-]+$/g, '')

  // 清理多个连续的连字符
  displayTitle = displayTitle.replace(/\-+/g, '-')

  // 清理连字符周围的多余空格
  displayTitle = displayTitle.replace(/\s*\-\s*/g, ' - ')

  return { displayTitle, originalTitle, tags }
}

/**
 * 生成标签的 slug
 * @param name 标签名称
 * @returns 标签 slug
 */
export function generateTagSlug(name: string): string {
  // 添加随机字符串确保唯一性
  const randomStr = Math.random().toString(36).substring(2, 6)
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') + '-' + randomStr
}

/**
 * 生成分类的 slug
 * @param name 分类名称
 * @returns 分类 slug
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * 从内容中提取摘要
 * @param content HTML 内容
 * @param maxLength 最大长度
 * @returns 提取的摘要
 */
export function extractExcerpt(content: string, maxLength: number = 200): string {
  // 移除 HTML 标签
  const textContent = content.replace(/<[^>]*>/g, '')

  // 截取指定长度
  if (textContent.length <= maxLength) {
    return textContent
  }

  // 查找最后一个完整的句子或单词
  let excerpt = textContent.substring(0, maxLength)
  const lastPeriod = excerpt.lastIndexOf('。')
  const lastSpace = excerpt.lastIndexOf(' ')

  if (lastPeriod > 0 && lastPeriod > maxLength * 0.7) {
    // 如果找到句号，并且句号位置在摘要的后半部分，则截取到句号
    excerpt = excerpt.substring(0, lastPeriod + 1)
  } else if (lastSpace > 0 && lastSpace > maxLength * 0.8) {
    // 如果找到空格，并且空格位置在摘要的后部分，则截取到空格
    excerpt = excerpt.substring(0, lastSpace)
  }

  return excerpt + '...'
}

/**
 * 检查内容中是否包含敏感词
 * @param content 要检查的内容
 * @param sensitiveWords 敏感词列表
 * @returns 包含的敏感词列表
 */
export function checkSensitiveWords(content: string, sensitiveWords: string[]): string[] {
  const foundWords: string[] = []
  const textContent = content.toLowerCase().replace(/<[^>]*>/g, '')

  for (const word of sensitiveWords) {
    if (textContent.includes(word.toLowerCase())) {
      foundWords.push(word)
    }
  }

  return foundWords
}

/**
 * 格式化内容状态为中文
 * @param status 内容状态
 * @returns 格式化后的状态文本
 */
export function formatContentStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'DRAFT': '草稿',
    'REVIEW': '待审核',
    'PENDING': '待审核',
    'PENDING_REVIEW': '待审核',
    'PUBLISHED': '已发布',
    'REJECTED': '已拒绝',
    'ARCHIVED': '已归档'
  }

  return statusMap[status] || status
}

/**
 * 根据预览百分比处理内容
 * @param content HTML 内容
 * @param previewPercentage 预览百分比 (0-100)
 * @returns 处理后的内容
 */
export function processContentForPreview(content: string, previewPercentage: number): string {
  // 如果预览百分比为100%或更高，返回完整内容
  if (previewPercentage >= 100) {
    return content
  }

  // 如果预览百分比为0或更低，返回空内容
  if (previewPercentage <= 0) {
    return ''
  }

  // 解析HTML内容，按段落分割
  const paragraphRegex = /<p[^>]*>.*?<\/p>/gi
  const paragraphs = content.match(paragraphRegex) || []

  // 如果没有段落，按其他HTML标签分割
  if (paragraphs.length === 0) {
    const blockRegex = /<(div|h[1-6]|section|article|blockquote)[^>]*>.*?<\/\1>/gi
    const blocks = content.match(blockRegex) || []

    if (blocks.length === 0) {
      // 如果没有块级元素，按字符数截取
      const targetLength = Math.floor(content.length * (previewPercentage / 100))
      return content.substring(0, targetLength) + (targetLength < content.length ? '...' : '')
    }

    // 按块级元素处理
    const targetBlocks = Math.ceil(blocks.length * (previewPercentage / 100))
    return blocks.slice(0, targetBlocks).join('')
  }

  // 按段落处理
  const targetParagraphs = Math.ceil(paragraphs.length * (previewPercentage / 100))
  const previewContent = paragraphs.slice(0, targetParagraphs).join('')

  // 保留其他非段落内容（如图片、表格等）
  const nonParagraphContent = content.replace(paragraphRegex, '')

  return previewContent + nonParagraphContent
}

/**
 * 检查用户是否有完整内容访问权限
 * @param userGroup 用户组信息
 * @returns 是否有完整访问权限
 */
export function hasFullContentAccess(userGroup: any): boolean {
  if (!userGroup) {
    return false
  }

  return userGroup.previewPercentage >= 100
}

/**
 * 获取内容预览信息
 * @param content 原始内容
 * @param userGroup 用户组信息
 * @returns 预览信息对象
 */
export function getContentPreviewInfo(content: string, userGroup: any) {
  const previewPercentage = userGroup?.previewPercentage || 0
  const hasFullAccess = hasFullContentAccess(userGroup)

  return {
    previewPercentage,
    hasFullAccess,
    previewContent: hasFullAccess ? content : processContentForPreview(content, previewPercentage),
    isLimited: !hasFullAccess && previewPercentage < 100
  }
}

/**
 * 检查用户是否有视频播放权限
 * @param userGroup 用户组信息
 * @returns 是否有视频播放权限
 */
export function hasVideoPlayPermission(userGroup: any): boolean {
  if (!userGroup || !userGroup.permissions) {
    return false
  }

  // 检查用户组权限中是否包含视频播放权限
  const permissions = typeof userGroup.permissions === 'string'
    ? JSON.parse(userGroup.permissions)
    : userGroup.permissions

  return permissions.video?.includes('play') || false
}

/**
 * 处理内容中的视频，根据权限替换为提示信息
 * @param content 原始内容
 * @param hasVideoPermission 是否有视频播放权限
 * @returns 处理后的内容
 */
export function processVideoContent(content: string, hasVideoPermission: boolean): string {
  if (hasVideoPermission) {
    return content
  }

  // 视频标签的正则表达式
  const videoRegex = /<video[^>]*>[\s\S]*?<\/video>/gi
  const iframeVideoRegex = /<iframe[^>]*(?:youtube|youku|bilibili|vimeo)[^>]*>[\s\S]*?<\/iframe>/gi

  // 视频权限提示组件
  const videoPlaceholder = `
    <div class="video-permission-notice bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center my-4">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">🎬 视频内容</h3>
          <p class="text-gray-600 mb-4">此处包含视频内容，您当前的用户组暂无播放权限</p>
          <div class="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            升级会员以观看视频内容
          </div>
        </div>
      </div>
    </div>
  `

  // 替换视频标签
  let processedContent = content.replace(videoRegex, videoPlaceholder)
  processedContent = processedContent.replace(iframeVideoRegex, videoPlaceholder)

  return processedContent
}

/**
 * 获取内容预览信息（包含视频权限处理）
 * @param content 原始内容
 * @param userGroup 用户组信息
 * @returns 预览信息对象
 */
export function getContentPreviewInfoWithVideo(content: string, userGroup: any) {
  const previewPercentage = userGroup?.previewPercentage || 0
  const hasFullAccess = hasFullContentAccess(userGroup)
  const hasVideoPermission = hasVideoPlayPermission(userGroup)

  // 先处理预览限制
  let processedContent = hasFullAccess ? content : processContentForPreview(content, previewPercentage)

  // 再处理视频权限
  processedContent = processVideoContent(processedContent, hasVideoPermission)

  return {
    previewPercentage,
    hasFullAccess,
    hasVideoPermission,
    previewContent: processedContent,
    isLimited: !hasFullAccess && previewPercentage < 100,
    hasVideoRestriction: !hasVideoPermission
  }
}

/**
 * 格式化审核状态为中文
 * @param status 审核状态
 * @returns 格式化后的状态文本
 */
export function formatReviewStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'NEEDS_CHANGES': '需要修改'
  }

  return statusMap[status] || status
}

/**
 * 格式化数字为k、M格式
 * @param num 要格式化的数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return Math.floor(num / 1000000) + 'M'
  }
  if (num >= 1000) {
    return Math.floor(num / 1000) + 'k'
  }
  return num.toString()
}

/**
 * 构建分类树
 * @param categories 分类列表
 * @returns 树形结构的分类
 */
export function buildCategoryTree(categories: any[]): any[] {
  const categoryMap = new Map()
  const rootCategories: any[] = []

  // 首先，将所有分类添加到 Map 中
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  // 然后，构建树形结构
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)

    if (category.parentId === null) {
      // 如果没有父分类，则添加到根分类列表
      rootCategories.push(categoryWithChildren)
    } else {
      // 如果有父分类，则添加到父分类的 children 数组
      const parentCategory = categoryMap.get(category.parentId)
      if (parentCategory) {
        parentCategory.children.push(categoryWithChildren)
      }
    }
  })

  // 对每个级别的分类按 order 排序
  const sortCategoriesByOrder = (categories: any[]) => {
    categories.sort((a, b) => a.order - b.order)
    categories.forEach(category => {
      if (category.children.length > 0) {
        sortCategoriesByOrder(category.children)
      }
    })
  }

  sortCategoriesByOrder(rootCategories)

  return rootCategories
}

/**
 * 获取分类的完整路径
 * @param categoryId 分类ID
 * @param categories 所有分类
 * @returns 分类路径数组
 */
export function getCategoryPath(categoryId: number, categories: any[]): any[] {
  const path: any[] = []

  const findPath = (id: number): boolean => {
    for (const category of categories) {
      if (category.id === id) {
        path.unshift(category)

        if (category.parentId === null) {
          return true
        }

        return findPath(category.parentId)
      }
    }

    return false
  }

  findPath(categoryId)

  return path
}
