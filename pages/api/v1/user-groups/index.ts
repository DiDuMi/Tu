import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { paginatedResponse, errorResponse, successResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
  search: z.string().optional(),
})

const createUserGroupSchema = z.object({
  name: z.string().min(2, '名称至少需要2个字符').max(50, '名称不能超过50个字符'),
  description: z.string().optional(),
  permissions: z.record(z.array(z.string())),
  uploadLimits: z
    .object({
      maxFileSize: z.number().optional(),
      allowedTypes: z.array(z.string()).optional(),
    })
    .optional(),
  previewPercentage: z.number().min(0).max(100).default(100),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET和POST方法
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  // GET方法：获取用户组列表
  if (req.method === 'GET') {
    try {
      // 验证查询参数
      const validationResult = querySchema.safeParse(req.query)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '查询参数验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { page, limit, search } = validationResult.data

      // 构建查询条件
      const where = {
        // UserGroup模型没有deletedAt字段，不需要指定
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }),
      }

      console.log('用户组查询条件:', where)

      // 查询总数
      const total = await prisma.userGroup.count({ where })

      // 查询用户组列表
      const userGroups = await prisma.userGroup.findMany({
        where,
        select: {
          id: true,
          uuid: true,
          name: true,
          description: true,
          permissions: true,
          uploadLimits: true,
          previewPercentage: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      // 处理JSON字段
      const formattedUserGroups = userGroups.map((group) => ({
        ...group,
        permissions: JSON.parse(group.permissions as string),
        uploadLimits: group.uploadLimits ? JSON.parse(group.uploadLimits as string) : null,
        userCount: group._count.users,
        _count: undefined,
      }))

      // 返回分页响应
      return paginatedResponse(res, formattedUserGroups, total, page, limit)
    } catch (error) {
      console.error('获取用户组列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取用户组列表失败',
        undefined,
        500
      )
    }
  }

  // POST方法：创建用户组
  if (req.method === 'POST') {
    try {
      // 验证请求数据
      const validationResult = createUserGroupSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, description, permissions, uploadLimits, previewPercentage } = validationResult.data

      // 检查名称是否已存在
      const existingGroup = await prisma.userGroup.findFirst({
        where: { name },
      })

      if (existingGroup) {
        return errorResponse(
          res,
          'NAME_ALREADY_EXISTS',
          '该用户组名称已存在',
          undefined,
          409
        )
      }

      // 创建用户组
      const userGroup = await prisma.userGroup.create({
        data: {
          name,
          description,
          permissions: JSON.stringify(permissions),
          uploadLimits: uploadLimits ? JSON.stringify(uploadLimits) : null,
          previewPercentage,
          // UserGroup模型没有deletedAt字段，不需要指定
        },
      })

      console.log('用户组创建成功:', { id: userGroup.id, uuid: userGroup.uuid })

      // 处理JSON字段
      const formattedUserGroup = {
        ...userGroup,
        permissions: JSON.parse(userGroup.permissions as string),
        uploadLimits: userGroup.uploadLimits ? JSON.parse(userGroup.uploadLimits as string) : null,
      }

      return successResponse(
        res,
        formattedUserGroup,
        '用户组创建成功',
        201
      )
    } catch (error) {
      console.error('创建用户组失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '创建用户组失败',
        undefined,
        500
      )
    }
  }
}

// 添加调试信息
async function debugHandler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[用户组API] 请求方法:', req.method);
  console.log('[用户组API] 请求URL:', req.url);
  console.log('[用户组API] 请求查询参数:', req.query);
  console.log('[用户组API] 请求体:', req.body);

  // 获取会话信息
  const session = await getServerSession(req, res, authOptions);
  console.log('[用户组API] 会话信息:', session ? {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role
    }
  } : '未认证');

  return handler(req, res);
}

export default withErrorHandler(withOperator(debugHandler))
