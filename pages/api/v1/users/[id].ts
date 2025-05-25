import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api'
import { z } from 'zod'
import { hash } from 'bcrypt'

// 请求验证模式
const updateUserSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符').optional(),
  email: z.string().email('请输入有效的邮箱地址').optional(),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      '密码必须包含小写字母、大写字母、数字和特殊字符'
    )
    .optional(),
  role: z.enum(['GUEST', 'REGISTERED', 'MEMBER', 'ANNUAL_MEMBER', 'OPERATOR', 'ADMIN']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  userGroupId: z.number().optional().nullable(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return errorResponse(
      res,
      'INVALID_PARAMETER',
      '无效的用户ID',
      undefined,
      400
    )
  }

  // 查询用户
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: isNaN(Number(id)) ? undefined : Number(id) },
        { uuid: id },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      uuid: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      telegramUsername: true,
      telegramId: true,
      applicationReason: true,
      createdAt: true,
      updatedAt: true,
      userGroup: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
      userPoint: {
        select: {
          balance: true,
          totalEarned: true,
          totalSpent: true,
        },
      },
    },
  })

  if (!user) {
    return notFoundResponse(res, '用户不存在')
  }

  // GET方法：获取用户详情
  if (req.method === 'GET') {
    return successResponse(res, user)
  }

  // PUT方法：更新用户
  if (req.method === 'PUT') {
    try {
      // 验证请求数据
      const validationResult = updateUserSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, email, password, role, status, userGroupId } = validationResult.data

      // 如果要更新邮箱，检查邮箱是否已被其他用户使用
      if (email && email !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          return errorResponse(
            res,
            'EMAIL_ALREADY_EXISTS',
            '该邮箱已被注册',
            undefined,
            409
          )
        }
      }

      // 准备更新数据
      const updateData: any = {}
      if (name) updateData.name = name
      if (email) updateData.email = email
      if (password) updateData.password = await hash(password, 10)
      if (role) updateData.role = role
      if (status) updateData.status = status
      if (userGroupId !== undefined) updateData.userGroupId = userGroupId

      // 更新用户
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          userGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return successResponse(res, updatedUser, '用户更新成功')
    } catch (error) {
      console.error('更新用户失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新用户失败',
        undefined,
        500
      )
    }
  }

  // DELETE方法：删除用户（软删除）
  if (req.method === 'DELETE') {
    try {
      // 软删除用户
      await prisma.user.update({
        where: { id: user.id },
        data: { deletedAt: new Date() },
      })

      return successResponse(res, { id: user.id }, '用户删除成功')
    } catch (error) {
      console.error('删除用户失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '删除用户失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
  })
}

export default withErrorHandler(withOperator(handler))
