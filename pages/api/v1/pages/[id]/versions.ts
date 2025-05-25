import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

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
    select: {
      id: true,
      userId: true,
    },
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

  // 检查权限（只有作者或管理员/操作员可以查看版本历史）
  if (parseInt(session.user.id) !== page.userId &&
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'OPERATOR') {
    return errorResponse(
      res,
      'FORBIDDEN',
      '无权查看此内容的版本历史',
      undefined,
      403
    )
  }

  // GET 请求 - 获取版本列表
  if (req.method === 'GET') {
    try {
      // 验证请求参数
      const validationResult = querySchema.safeParse(req.query)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求参数验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { page: pageNum, limit } = validationResult.data

      // 查询版本列表
      const versions = await prisma.pageVersion.findMany({
        where: { pageId: page.id },
        select: {
          id: true,
          uuid: true,
          title: true,
          versionNumber: true,
          changeLog: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { versionNumber: 'desc' },
        skip: (pageNum - 1) * limit,
        take: limit,
      })

      // 查询总数
      const total = await prisma.pageVersion.count({
        where: { pageId: page.id },
      })

      return successResponse(res, {
        items: versions,
        pagination: {
          page: pageNum,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('获取版本列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取版本列表失败',
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
