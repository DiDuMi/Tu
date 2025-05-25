import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'
import { z } from 'zod'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'

// 登录请求验证模式
const signinSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
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
    const validationResult = signinSchema.safeParse(req.body)

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

      return errorResponse(res, 'VALIDATION_ERROR', '请求数据验证失败', errors, 422)
    }

    const { email, password } = validationResult.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        password: true,
        status: true,
        role: true,
        createdAt: true,
        deletedAt: true,
      },
    })

    // 检查用户是否存在
    if (!user || user.deletedAt) {
      return errorResponse(
        res,
        'INVALID_CREDENTIALS',
        '邮箱或密码错误',
        undefined,
        401
      )
    }

    // 验证密码
    if (!user.password) {
      return errorResponse(
        res,
        'INVALID_CREDENTIALS',
        '邮箱或密码错误',
        undefined,
        401
      )
    }

    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      return errorResponse(
        res,
        'INVALID_CREDENTIALS',
        '邮箱或密码错误',
        undefined,
        401
      )
    }

    // 检查用户状态
    if (user.status === 'PENDING') {
      return res.status(200).json({
        success: false,
        error: {
          code: 'ACCOUNT_PENDING',
          message: '账号正在审核中',
          details: {
            status: 'PENDING',
            userInfo: {
              name: user.name,
              email: user.email,
              createdAt: user.createdAt,
            },
          },
        },
      })
    }

    if (user.status === 'REJECTED') {
      // 查询拒绝原因（从系统日志中获取）
      const rejectLog = await prisma.systemLog.findFirst({
        where: {
          module: 'USER_MANAGEMENT',
          action: 'USER_REJECTED',
          message: {
            contains: user.email,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      let rejectReason = null
      if (rejectLog && rejectLog.details) {
        try {
          const logDetails = JSON.parse(rejectLog.details)
          rejectReason = logDetails.reason
        } catch (e) {
          // 忽略JSON解析错误
        }
      }

      return res.status(200).json({
        success: false,
        error: {
          code: 'ACCOUNT_REJECTED',
          message: '账号申请已被拒绝',
          details: {
            status: 'REJECTED',
            rejectReason,
            userInfo: {
              name: user.name,
              email: user.email,
              createdAt: user.createdAt,
            },
          },
        },
      })
    }

    if (user.status === 'SUSPENDED') {
      return errorResponse(
        res,
        'ACCOUNT_SUSPENDED',
        '账号已被禁用，请联系管理员',
        undefined,
        403
      )
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(
        res,
        'ACCOUNT_INACTIVE',
        '账号状态异常，请联系管理员',
        undefined,
        403
      )
    }

    // 登录成功，返回用户信息（不包含密码）
    return successResponse(
      res,
      {
        user: {
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      '登录成功'
    )
  } catch (error) {
    console.error('登录失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '登录失败，请稍后重试',
      undefined,
      500
    )
  }
}

export default withErrorHandler(handler)
