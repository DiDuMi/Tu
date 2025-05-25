import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'], {
    errorMap: () => ({ message: '状态必须是有效的内容状态' })
  }),
  reason: z.string().optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取会话信息
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
    where: { id: parseInt(id, 10) },
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

  // 检查权限（只有作者或管理员/操作员可以更新内容状态）
  if (parseInt(session.user.id, 10) !== page.userId &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '无权更新此内容状态',
      undefined,
      403
    )
  }

  // PATCH 请求 - 更新内容状态
  if (req.method === 'PATCH') {
    try {
      // 验证请求数据
      const validationResult = updateStatusSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { status, reason } = validationResult.data

      console.log(`更新内容状态: ID=${page.id}, 状态=${status}, 原因=${reason || '无'}`)

      // 处理发布时间
      let publishedAt = page.publishedAt
      if (status === 'PUBLISHED' && !publishedAt) {
        publishedAt = new Date()
      }

      // 更新内容状态
      console.log(`更新内容状态: ID=${page.id}, 旧状态=${page.status}, 新状态=${status}`)

      // 构建更新数据
      const updateData: any = {
        status,
        updatedAt: new Date(),
      }

      // 处理发布时间
      if (status === 'PUBLISHED' && !publishedAt) {
        updateData.publishedAt = new Date()
      } else if (publishedAt) {
        updateData.publishedAt = publishedAt
      }

      const updatedPage = await prisma.page.update({
        where: { id: page.id },
        data: updateData,
      })

      // 如果是拒绝状态，创建审核反馈
      if (status === 'REJECTED' && reason) {
        await prisma.reviewFeedback.create({
          data: {
            pageId: page.id,
            reviewerId: parseInt(session.user.id, 10),
            content: reason,
            status: 'REJECTED',
          }
        })
      }

      return successResponse(res, {
        id: updatedPage.id,
        uuid: updatedPage.uuid,
        status: updatedPage.status,
      }, '内容状态更新成功')
    } catch (error) {
      console.error('更新内容状态失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新内容状态失败',
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
