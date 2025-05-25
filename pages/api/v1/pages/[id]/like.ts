import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { successResponse, errorResponse } from '@/lib/api'
import { withErrorHandler } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

  // 检查用户是否已登录
  if (!session) {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      '未授权操作',
      undefined,
      401
    )
  }

  if (!id || typeof id !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的内容ID',
      undefined,
      422
    )
  }

  // 查找内容
  const page = await prisma.page.findUnique({
    where: { uuid: id },
  })

  if (!page) {
    return errorResponse(
      res,
      'NOT_FOUND',
      '内容不存在',
      undefined,
      404
    )
  }

  // 只允许对已发布的内容进行点赞
  if (page.status !== 'PUBLISHED') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '只能对已发布的内容进行点赞',
      undefined,
      422
    )
  }

  // POST 请求 - 点赞/取消点赞
  if (req.method === 'POST') {
    try {
      // 查找是否已点赞
      const userId = parseInt(session.user.id, 10)
      if (isNaN(userId)) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '无效的用户ID',
          undefined,
          400
        )
      }

      const existingLike = await prisma.like.findUnique({
        where: {
          userId_pageId: {
            userId: userId,
            pageId: page.id,
          },
        },
      })

      // 使用事务确保数据一致性
      return await prisma.$transaction(async (tx) => {
        if (existingLike) {
          // 已点赞，取消点赞
          await tx.like.delete({
            where: {
              id: existingLike.id,
            },
          })

          // 获取当前点赞数量
          const likeCount = await tx.like.count({
            where: {
              pageId: page.id
            }
          })

          return successResponse(res, {
            liked: false,
            likeCount: likeCount
          }, '取消点赞成功')
        } else {
          // 未点赞，添加点赞
          await tx.like.create({
            data: {
              userId: userId,
              pageId: page.id,
            },
          })

          // 获取当前点赞数量
          const likeCount = await tx.like.count({
            where: {
              pageId: page.id
            }
          })

          return successResponse(res, {
            liked: true,
            likeCount: likeCount
          }, '点赞成功')
        }
      })
    } catch (error) {
      console.error('处理点赞失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '处理点赞失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  else {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(handler)
