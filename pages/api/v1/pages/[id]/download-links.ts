import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { encrypt, decrypt } from '@/lib/encryption'
import { DOWNLOAD_PLATFORMS, validateDownloadUrl } from '@/lib/download-platforms'

// 创建下载链接验证模式
const createDownloadLinkSchema = z.object({
  platform: z.string().min(1, '请选择网盘平台'),
  url: z.string().min(1, '请输入下载链接').refine((url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, '请输入有效的下载链接'),
  extractCode: z.string().optional().nullable(),
  pointCost: z.number().min(0, '积分不能为负数').max(10000, '积分不能超过10000'),
  title: z.string().min(1, '请输入链接标题').max(100, '标题不能超过100个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional().nullable(),
  sortOrder: z.number().default(0)
})

// 更新下载链接验证模式
const updateDownloadLinkSchema = createDownloadLinkSchema.partial()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id: pageId } = req.query

  if (!pageId || Array.isArray(pageId)) {
    return errorResponse(res, 'INVALID_PARAMETER', '无效的页面ID', undefined, 400)
  }

  // 验证页面是否存在
  const page = await prisma.page.findFirst({
    where: {
      OR: [
        { id: isNaN(Number(pageId)) ? undefined : Number(pageId) },
        { uuid: pageId }
      ],
      deletedAt: null
    },
    select: { id: true, userId: true, title: true }
  })

  if (!page) {
    return errorResponse(res, 'PAGE_NOT_FOUND', '页面不存在', undefined, 404)
  }

  const currentUserId = session ? parseInt(session.user.id, 10) : null

  // GET - 获取页面的下载链接列表
  if (req.method === 'GET') {
    try {
      const downloadLinks = await prisma.downloadLink.findMany({
        where: {
          pageId: page.id,
          deletedAt: null
        },
        select: {
          id: true,
          uuid: true,
          platform: true,
          pointCost: true,
          title: true,
          description: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          // 只有创建者才能看到完整信息
          ...(currentUserId && page.userId === currentUserId ? {
            url: true,
            extractCode: true
          } : {})
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      })

      // 解密敏感信息（仅对创建者）
      const formattedLinks = downloadLinks.map(link => ({
        ...link,
        url: currentUserId && page.userId === currentUserId && link.url ? decrypt(link.url) : undefined,
        extractCode: currentUserId && page.userId === currentUserId && link.extractCode ? decrypt(link.extractCode) : undefined
      }))

      return successResponse(res, formattedLinks)
    } catch (error) {
      console.error('获取下载链接失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '获取下载链接失败', undefined, 500)
    }
  }

  // POST - 创建新的下载链接
  if (req.method === 'POST') {
    // 检查用户是否已登录
    if (!session) {
      return errorResponse(res, 'UNAUTHORIZED', '请先登录', undefined, 401)
    }

    // 只有页面创建者可以添加下载链接
    if (page.userId !== currentUserId) {
      return errorResponse(res, 'PERMISSION_DENIED', '只有内容创建者可以添加下载链接', undefined, 403)
    }

    try {
      console.log('创建下载链接请求数据:', req.body)

      const validationResult = createDownloadLinkSchema.safeParse(req.body)
      if (!validationResult.success) {
        console.error('数据验证失败:', validationResult.error.format())
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { platform, url, extractCode, pointCost, title, description, sortOrder } = validationResult.data

      // 验证平台是否支持
      const supportedPlatforms = DOWNLOAD_PLATFORMS.map(p => p.id)
      if (!supportedPlatforms.includes(platform)) {
        return errorResponse(res, 'INVALID_PLATFORM', '不支持的网盘平台', undefined, 400)
      }

      // 验证URL格式
      if (!validateDownloadUrl(url)) {
        return errorResponse(res, 'INVALID_URL', '无效的下载链接格式', undefined, 400)
      }

      // 加密敏感信息
      const encryptedUrl = encrypt(url)
      const encryptedExtractCode = extractCode ? encrypt(extractCode) : null

      const downloadLink = await prisma.downloadLink.create({
        data: {
          pageId: page.id,
          userId: currentUserId,
          platform,
          url: encryptedUrl,
          extractCode: encryptedExtractCode,
          pointCost,
          title,
          description,
          sortOrder
        },
        select: {
          id: true,
          uuid: true,
          platform: true,
          pointCost: true,
          title: true,
          description: true,
          isActive: true,
          sortOrder: true,
          createdAt: true
        }
      })

      return successResponse(res, downloadLink, '下载链接创建成功')
    } catch (error) {
      console.error('创建下载链接失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '创建下载链接失败', undefined, 500)
    }
  }

  return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
}

export default handler
