/**
 * 标签提取工具
 * 用于从内容中提取标签
 */

import { prisma } from './prisma'

/**
 * 从文本中提取标签
 * 标签格式为 #标签名
 * @param text 要提取标签的文本
 * @returns 提取到的标签数组
 */
export function extractTagsFromText(text: string): string[] {
  if (!text) return []

  // 匹配 #标签名 格式的标签
  // 标签名可以包含中文、英文、数字、下划线
  // 但不能包含空格和特殊字符
  const tagRegex = /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  const matches = text.match(tagRegex)

  if (!matches) return []

  // 去除 # 符号并去重
  return Array.from(new Set(matches.map(tag => tag.substring(1))))
}

/**
 * 从HTML内容中提取标签
 * @param html HTML内容
 * @returns 提取到的标签数组
 */
export function extractTagsFromHtml(html: string): string[] {
  if (!html) return []

  // 移除HTML标签，只保留文本内容
  const textContent = html.replace(/<[^>]*>/g, ' ')

  // 从文本中提取标签
  return extractTagsFromText(textContent)
}

/**
 * 从标题和内容中提取标签
 * @param title 标题
 * @param content 内容（HTML格式）
 * @returns 提取到的标签数组
 */
export function extractTags(title: string, content: string): string[] {
  const titleTags = extractTagsFromText(title)
  const contentTags = extractTagsFromHtml(content)

  // 合并标题和内容中的标签并去重
  return Array.from(new Set([...titleTags, ...contentTags]))
}

/**
 * 创建或获取标签
 * @param tagNames 标签名数组
 * @returns 标签ID数组
 */
export async function createOrGetTags(tagNames: string[]): Promise<number[]> {
  if (!tagNames.length) return []

  const tagIds: number[] = []

  // 使用事务确保数据一致性
  await prisma.$transaction(async (tx) => {
    for (const name of tagNames) {
      // 标签名规范化：去除首尾空格，转换为小写
      const normalizedName = name.trim()
      if (!normalizedName) continue

      // 生成标签slug：将标签名转换为URL友好的格式
      const slug = normalizedName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '')

      // 查找或创建标签
      let tag = await tx.tag.findFirst({
        where: {
          OR: [
            { name: normalizedName },
            { slug }
          ]
        }
      })

      if (!tag) {
        // 创建新标签
        tag = await tx.tag.create({
          data: {
            name: normalizedName,
            slug,
            useCount: 1
          }
        })
      } else {
        // 更新标签使用计数
        await tx.tag.update({
          where: { id: tag.id },
          data: { useCount: { increment: 1 } }
        })
      }

      tagIds.push(tag.id)
    }
  })

  return tagIds
}

/**
 * 处理内容标签
 * 从标题和内容中提取标签，创建不存在的标签，并返回标签ID数组
 * @param title 标题
 * @param content 内容（HTML格式）
 * @param existingTagIds 已有的标签ID数组（可选）
 * @returns 标签ID数组
 */
export async function processContentTags(
  title: string,
  content: string,
  existingTagIds: number[] = []
): Promise<number[]> {
  // 提取标签
  const extractedTagNames = extractTags(title, content)

  if (!extractedTagNames.length && !existingTagIds.length) {
    return []
  }

  // 创建或获取提取的标签
  const extractedTagIds = await createOrGetTags(extractedTagNames)

  // 合并已有标签和提取的标签，并去重
  return Array.from(new Set([...existingTagIds, ...extractedTagIds]))
}
