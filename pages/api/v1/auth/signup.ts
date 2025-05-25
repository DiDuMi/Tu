import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api'

// 请求验证模式
const signupSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      '密码必须包含小写字母、大写字母、数字和特殊字符'
    ),
  // 新增选填字段
  telegramUsername: z.string().max(50, 'Telegram用户名不能超过50个字符').optional(),
  telegramId: z.string().max(50, 'Telegram ID不能超过50个字符').optional(),
  applicationReason: z.string().max(500, '申请原因不能超过500个字符').optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  try {
    // 验证请求数据
    const validationResult = signupSchema.safeParse(req.body)

    if (!validationResult.success) {
      const errors: Record<string, string> = {}
      const formattedErrors = validationResult.error.format()

      // 转换Zod错误格式为简单的字符串映射
      Object.keys(formattedErrors).forEach(key => {
        if (key !== '_errors' && formattedErrors[key as keyof typeof formattedErrors]) {
          const fieldError = formattedErrors[key as keyof typeof formattedErrors] as any
          if (fieldError && fieldError._errors && fieldError._errors.length > 0) {
            errors[key] = fieldError._errors[0]
          }
        }
      })

      return validationErrorResponse(res, errors)
    }

    const { name, email, password, telegramUsername, telegramId, applicationReason } = validationResult.data

    // 检查邮箱是否已存在
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

    // 检查Telegram用户名是否已存在（如果提供）
    if (telegramUsername) {
      const existingTelegramUser = await prisma.user.findFirst({
        where: { telegramUsername },
      })

      if (existingTelegramUser) {
        return errorResponse(
          res,
          'TELEGRAM_USERNAME_EXISTS',
          '该Telegram用户名已被注册',
          undefined,
          409
        )
      }
    }

    // 检查Telegram ID是否已存在（如果提供）
    if (telegramId) {
      const existingTelegramIdUser = await prisma.user.findFirst({
        where: { telegramId },
      })

      if (existingTelegramIdUser) {
        return errorResponse(
          res,
          'TELEGRAM_ID_EXISTS',
          '该Telegram ID已被注册',
          undefined,
          409
        )
      }
    }

    // 获取普通会员组
    const memberGroup = await prisma.userGroup.findFirst({
      where: {
        name: '普通会员组',
      },
    })

    // 创建用户
    const hashedPassword = await hash(password, 10)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'REGISTERED',
        status: 'PENDING', // 需要审核
        userGroupId: memberGroup?.id,
        telegramUsername: telegramUsername || null,
        telegramId: telegramId || null,
        applicationReason: applicationReason || null,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    // 创建用户积分账户
    await prisma.userPoint.create({
      data: {
        userId: user.id,
        balance: 0,
        totalEarned: 0,
      },
    })

    return successResponse(
      res,
      { user },
      '注册成功，请等待管理员审核',
      201
    )
  } catch (error) {
    console.error('注册失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '注册失败，请稍后重试',
      undefined,
      500
    )
  }
}

export default withErrorHandler(handler)
