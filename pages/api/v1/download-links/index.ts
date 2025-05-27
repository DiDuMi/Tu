import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { sendSuccessResponse, sendErrorResponse } from '@/lib/api-response'
import { decrypt } from '@/lib/encryption'

/**
 * 下载链接列表API
 * GET /api/v1/download-links - 获取指定页面的下载链接列表
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return sendErrorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
  }

  try {
    const { pageId } = req.query

    if (!pageId || typeof pageId !== 'string') {
      return sendErrorResponse(res, 'INVALID_PAGE_ID', '页面ID无效', undefined, 400)
    }

    // 获取当前用户信息（可选）
    const session = await getServerSession(req, res, authOptions)
    const currentUserId = session?.user?.id

    // 查找页面
    const page = await prisma.page.findFirst({
      where: {
        OR: [
          { id: parseInt(pageId) },
          { uuid: pageId }
        ],
        deletedAt: null
      }
    })

    if (!page) {
      return sendErrorResponse(res, 'PAGE_NOT_FOUND', '页面不存在', undefined, 404)
    }

    // 获取下载链接列表
    const downloadLinks = await prisma.downloadLink.findMany({
      where: {
        pageId: page.id,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        uuid: true,
        title: true,
        description: true,
        platform: true,
        pointCost: true,
        createdAt: true,
        userId: true,
        // 不直接返回加密的URL和提取码
        url: false,
        extractCode: false
      }
    })

    // 如果用户已登录，检查购买状态
    let purchaseInfo: Record<number, any> = {}
    if (currentUserId) {
      const purchases = await prisma.downloadPurchase.findMany({
        where: {
          userId: currentUserId,
          downloadId: {
            in: downloadLinks.map(link => link.id)
          }
        },
        select: {
          downloadId: true,
          createdAt: true
        }
      })

      // 构建购买信息映射
      for (const purchase of purchases) {
        const downloadLink = downloadLinks.find(link => link.id === purchase.downloadId)
        if (downloadLink) {
          // 获取完整的下载链接信息（包含解密后的URL和提取码）
          const fullLink = await prisma.downloadLink.findUnique({
            where: { id: purchase.downloadId }
          })

          if (fullLink) {
            purchaseInfo[purchase.downloadId] = {
              purchased: true,
              url: decrypt(fullLink.url),
              extractCode: fullLink.extractCode ? decrypt(fullLink.extractCode) : null,
              platform: fullLink.platform,
              title: fullLink.title,
              pointCost: fullLink.pointCost,
              purchaseDate: purchase.createdAt
            }
          }
        }
      }
    }

    return sendSuccessResponse(res, {
      downloadLinks,
      purchaseInfo,
      totalCount: downloadLinks.length
    })

  } catch (error) {
    console.error('获取下载链接列表失败:', error)
    return sendErrorResponse(res, 'SERVER_ERROR', '获取下载链接列表失败', undefined, 500)
  }
}

export default handler
