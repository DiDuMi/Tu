import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api'
import { z } from 'zod'

// 解除关联验证模式
const unlinkSchema = z.object({
  provider: z.enum(['telegram', 'github', 'google'], {
    errorMap: () => ({ message: '不支持的社交平台' }),
  }),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user) {
    return unauthorizedResponse(res)
  }

  const userId = parseInt(session.user.id)

  // GET: 获取用户的社交账号列表
  if (req.method === 'GET') {
    try {
      const socialAccounts = await prisma.socialAccount.findMany({
        where: {
          userId,
        },
        select: {
          id: true,
          provider: true,
          providerId: true,
          username: true,
          displayName: true,
          email: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // 格式化响应数据
      const formattedAccounts = socialAccounts.map(account => ({
        ...account,
        providerName: getProviderDisplayName(account.provider),
        canUnlink: socialAccounts.length > 1 || !!session.user.email, // 至少保留一种登录方式
      }))

      return successResponse(res, formattedAccounts)
    } catch (error) {
      console.error('获取社交账号列表失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '获取社交账号列表失败', undefined, 500)
    }
  }

  // DELETE: 解除社交账号关联
  if (req.method === 'DELETE') {
    try {
      const validationResult = unlinkSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { provider } = validationResult.data

      // 查找要解除关联的社交账号
      const socialAccount = await prisma.socialAccount.findUnique({
        where: {
          userId_provider: {
            userId,
            provider
          }
        }
      })

      if (!socialAccount) {
        return errorResponse(res, 'NOT_FOUND', '未找到要解除关联的社交账号', undefined, 404)
      }

      // 检查是否可以解除关联（至少保留一种登录方式）
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          socialAccounts: true
        }
      })

      if (!user) {
        return errorResponse(res, 'USER_NOT_FOUND', '用户不存在', undefined, 404)
      }

      // 如果用户没有密码且只有一个社交账号，不允许解除关联
      if (!user.password && user.socialAccounts.length <= 1) {
        return errorResponse(
          res,
          'CANNOT_UNLINK',
          '无法解除关联，请先设置密码或关联其他社交账号',
          undefined,
          400
        )
      }

      // 解除关联
      await prisma.socialAccount.delete({
        where: { id: socialAccount.id }
      })

      return successResponse(res, { provider }, '社交账号解除关联成功')
    } catch (error) {
      console.error('解除社交账号关联失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '解除关联失败', undefined, 500)
    }
  }

  // 不支持的方法
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
  })
}

// 获取社交平台显示名称
function getProviderDisplayName(provider: string): string {
  switch (provider) {
    case 'telegram':
      return 'Telegram'
    case 'github':
      return 'GitHub'
    case 'google':
      return 'Google'
    default:
      return provider
  }
}

export default withErrorHandler(handler)
