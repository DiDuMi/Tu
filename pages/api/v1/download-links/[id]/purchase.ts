import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'
import { decrypt } from '@/lib/encryption'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

  if (!session) {
    return errorResponse(res, 'UNAUTHORIZED', '请先登录', undefined, 401)
  }

  if (!id || Array.isArray(id)) {
    return errorResponse(res, 'INVALID_PARAMETER', '无效的下载链接ID', undefined, 400)
  }

  const currentUserId = parseInt(session.user.id, 10)

  // 查找下载链接
  const downloadLink = await prisma.downloadLink.findFirst({
    where: {
      OR: [
        { id: isNaN(Number(id)) ? undefined : Number(id) },
        { uuid: id }
      ],
      deletedAt: null,
      isActive: true
    },
    include: {
      page: {
        select: { id: true, userId: true, title: true }
      },
      user: {
        select: { id: true, name: true }
      }
    }
  })

  if (!downloadLink) {
    return errorResponse(res, 'DOWNLOAD_LINK_NOT_FOUND', '下载链接不存在或已禁用', undefined, 404)
  }

  // POST - 购买下载链接
  if (req.method === 'POST') {
    try {
      // 检查是否已经购买过
      const existingPurchase = await prisma.downloadPurchase.findUnique({
        where: {
          userId_downloadId: {
            userId: currentUserId,
            downloadId: downloadLink.id
          }
        }
      })

      if (existingPurchase) {
        // 如果已购买，直接返回下载信息
        return successResponse(res, {
          alreadyPurchased: true,
          url: decrypt(downloadLink.url),
          extractCode: downloadLink.extractCode ? decrypt(downloadLink.extractCode) : null,
          platform: downloadLink.platform,
          title: downloadLink.title,
          purchaseDate: existingPurchase.createdAt
        }, '您已兑换过此下载链接')
      }

      // 检查用户积分是否足够
      const userPoint = await prisma.userPoint.findUnique({
        where: { userId: currentUserId }
      })

      if (!userPoint || userPoint.balance < downloadLink.pointCost) {
        return errorResponse(
          res,
          'INSUFFICIENT_POINTS',
          `积分不足，需要 ${downloadLink.pointCost} 积分，当前余额 ${userPoint?.balance || 0} 积分`,
          { required: downloadLink.pointCost, current: userPoint?.balance || 0 },
          400
        )
      }

      // 使用事务处理购买流程
      const result = await prisma.$transaction(async (tx) => {
        // 1. 扣除购买者积分
        await tx.userPoint.update({
          where: { userId: currentUserId },
          data: {
            balance: { decrement: downloadLink.pointCost },
            totalSpent: { increment: downloadLink.pointCost }
          }
        })

        // 2. 增加创建者积分
        await tx.userPoint.upsert({
          where: { userId: downloadLink.userId },
          update: {
            balance: { increment: downloadLink.pointCost },
            totalEarned: { increment: downloadLink.pointCost }
          },
          create: {
            userId: downloadLink.userId,
            balance: downloadLink.pointCost,
            totalEarned: downloadLink.pointCost,
            totalSpent: 0
          }
        })

        // 3. 创建购买记录
        const purchase = await tx.downloadPurchase.create({
          data: {
            userId: currentUserId,
            downloadId: downloadLink.id,
            pointCost: downloadLink.pointCost
          }
        })

        // 4. 记录积分交易 - 购买者
        const buyerUserPoint = await tx.userPoint.findUnique({
          where: { userId: currentUserId }
        })

        if (buyerUserPoint) {
          await tx.pointTransaction.create({
            data: {
              userPointId: buyerUserPoint.id,
              amount: -downloadLink.pointCost,
              type: 'DOWNLOAD_PURCHASE',
              description: `购买下载链接：${downloadLink.title}`
            }
          })
        }

        // 5. 记录积分交易 - 创建者
        const creatorUserPoint = await tx.userPoint.findUnique({
          where: { userId: downloadLink.userId }
        })

        if (creatorUserPoint) {
          await tx.pointTransaction.create({
            data: {
              userPointId: creatorUserPoint.id,
              amount: downloadLink.pointCost,
              type: 'DOWNLOAD_SALE',
              description: `下载链接销售收入：${downloadLink.title}`
            }
          })
        }

        return purchase
      })

      // 返回下载信息
      return successResponse(res, {
        purchaseId: result.uuid,
        url: decrypt(downloadLink.url),
        extractCode: downloadLink.extractCode ? decrypt(downloadLink.extractCode) : null,
        platform: downloadLink.platform,
        title: downloadLink.title,
        pointCost: downloadLink.pointCost,
        purchaseDate: result.createdAt
      }, '兑换成功')

    } catch (error) {
      console.error('购买下载链接失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '购买失败，请稍后重试', undefined, 500)
    }
  }

  // GET - 获取购买状态和下载信息
  if (req.method === 'GET') {
    try {
      const purchase = await prisma.downloadPurchase.findUnique({
        where: {
          userId_downloadId: {
            userId: currentUserId,
            downloadId: downloadLink.id
          }
        }
      })

      if (!purchase) {
        return successResponse(res, {
          purchased: false,
          pointCost: downloadLink.pointCost,
          platform: downloadLink.platform,
          title: downloadLink.title
        })
      }

      // 更新访问记录
      await prisma.downloadPurchase.update({
        where: { id: purchase.id },
        data: {
          accessCount: { increment: 1 },
          lastAccess: new Date()
        }
      })

      return successResponse(res, {
        purchased: true,
        url: decrypt(downloadLink.url),
        extractCode: downloadLink.extractCode ? decrypt(downloadLink.extractCode) : null,
        platform: downloadLink.platform,
        title: downloadLink.title,
        purchaseDate: purchase.createdAt,
        accessCount: purchase.accessCount + 1
      })

    } catch (error) {
      console.error('获取购买信息失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '获取购买信息失败', undefined, 500)
    }
  }

  return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
}

export default handler
