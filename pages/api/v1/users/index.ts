import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { paginatedResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { hash } from 'bcrypt'

// 请求验证模式
const querySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(10),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  role: z.enum(['GUEST', 'REGISTERED', 'MEMBER', 'ANNUAL_MEMBER', 'OPERATOR', 'ADMIN']).optional(),
  search: z.string().optional(),
  email: z.string().email().optional(),
  userGroupId: z.coerce.number().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  sortField: z.enum(['id', 'name', 'email', 'role', 'status', 'createdAt']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
})

const createUserSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符'),
  role: z.enum(['GUEST', 'REGISTERED', 'MEMBER', 'ANNUAL_MEMBER', 'OPERATOR', 'ADMIN']),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']),
  userGroupId: z.number().optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许GET和POST方法
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  // GET方法：获取用户列表
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

      const {
        page,
        limit,
        status,
        role,
        search,
        email,
        userGroupId,
        dateStart,
        dateEnd,
        sortField,
        sortDirection
      } = validationResult.data

      // 构建查询条件
      const where = {
        // 明确指定deletedAt为null，确保软删除中间件不会干扰
        deletedAt: null,
        ...(status && { status }),
        ...(role && { role }),
        ...(userGroupId && { userGroupId }),
        ...(email && { email }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
        ...(dateStart || dateEnd ? {
          createdAt: {
            ...(dateStart && { gte: new Date(dateStart) }),
            ...(dateEnd && { lte: new Date(`${dateEnd}T23:59:59Z`) }),
          }
        } : {}),
      }

      console.log('用户查询条件:', where)

      // 查询总数
      const total = await prisma.user.count({ where })

      // 构建排序条件
      const orderBy: any = {}
      orderBy[sortField] = sortDirection

      // 查询用户列表
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          role: true,
          status: true,
          image: true,
          telegramUsername: true,
          telegramId: true,
          applicationReason: true,
          createdAt: true,
          updatedAt: true,
          userGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      })

      // 返回分页响应
      return paginatedResponse(res, users, total, page, limit)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取用户列表失败',
        undefined,
        500
      )
    }
  }

  // POST方法：创建用户
  if (req.method === 'POST') {
    try {
      console.log('接收到创建用户请求:', {
        body: {
          ...req.body,
          password: req.body.password ? '******' : undefined
        }
      })

      // 验证请求数据
      const validationResult = createUserSchema.safeParse(req.body)

      if (!validationResult.success) {
        console.log('验证失败:', validationResult.error.format())
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, email, password, role, status, userGroupId } = validationResult.data
      console.log('验证通过，处理数据:', {
        name,
        email,
        passwordLength: password ? password.length : 0,
        role,
        status,
        userGroupId
      })

      // 检查邮箱是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        console.log('邮箱已存在:', email)
        return errorResponse(
          res,
          'EMAIL_ALREADY_EXISTS',
          '该邮箱已被注册',
          undefined,
          409
        )
      }

      // 创建用户
      const hashedPassword = await hash(password, 10)
      console.log('密码哈希完成，准备创建用户')

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          status,
          // 明确设置deletedAt为null，确保软删除中间件不会干扰
          deletedAt: null,
          ...(userGroupId && { userGroupId }),
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          userGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      console.log('用户创建成功:', { userId: user.id, uuid: user.uuid })

      // 创建用户积分账户
      await prisma.userPoint.create({
        data: {
          userId: user.id,
          balance: 0,
          totalEarned: 0,
        },
      })

      console.log('用户积分账户创建成功')

      return res.status(201).json({
        success: true,
        data: user,
        message: '用户创建成功',
      })
    } catch (error) {
      console.error('创建用户失败:', error)
      // 提供更详细的错误信息
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error('错误详情:', {
        message: errorMessage,
        stack: errorStack
      })

      return errorResponse(
        res,
        'SERVER_ERROR',
        '创建用户失败: ' + errorMessage,
        undefined,
        500
      )
    }
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
