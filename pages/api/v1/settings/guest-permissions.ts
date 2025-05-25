import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { withErrorHandler } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { GUEST_PERMISSIONS } from '@/lib/homepage-permissions'

// 游客权限设置验证模式
const guestPermissionsSchema = z.object({
  canView: z.boolean(),
  canSearch: z.boolean(),
  allowedStatuses: z.array(z.string()),
  canCreateContent: z.boolean(),
  canComment: z.boolean(),
  canLike: z.boolean(),
  canFavorite: z.boolean(),
  previewPercentage: z.number().min(0).max(100),
  canPlayVideo: z.boolean(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取会话信息
  const session = await getServerSession(req, res, authOptions)

  // 检查用户是否已登录且为管理员
  if (!session || session.user.role !== 'ADMIN') {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      '未授权操作',
      undefined,
      401
    )
  }

  // GET 请求 - 获取游客权限设置
  if (req.method === 'GET') {
    try {
      // 从系统设置中获取游客权限配置
      const guestPermissionsSetting = await prisma.systemSetting.findUnique({
        where: { key: 'guest_permissions' }
      })

      let guestPermissions = GUEST_PERMISSIONS

      if (guestPermissionsSetting) {
        try {
          const savedPermissions = JSON.parse(guestPermissionsSetting.value)
          guestPermissions = { ...GUEST_PERMISSIONS, ...savedPermissions }
        } catch (error) {
          console.error('解析游客权限设置失败:', error)
        }
      }

      return successResponse(res, guestPermissions)
    } catch (error) {
      console.error('获取游客权限设置失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取游客权限设置失败',
        undefined,
        500
      )
    }
  }

  // PUT 请求 - 更新游客权限设置
  else if (req.method === 'PUT') {
    try {
      // 验证请求数据
      const validationResult = guestPermissionsSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const guestPermissions = validationResult.data

      // 保存到系统设置
      await prisma.systemSetting.upsert({
        where: { key: 'guest_permissions' },
        update: {
          value: JSON.stringify(guestPermissions),
          updatedAt: new Date(),
        },
        create: {
          key: 'guest_permissions',
          value: JSON.stringify(guestPermissions),
          type: 'JSON',
          group: 'permissions',
          description: '游客权限配置',
        },
      })

      // 记录操作日志
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          module: 'SETTINGS',
          action: 'UPDATE_GUEST_PERMISSIONS',
          message: '更新游客权限设置',
          details: JSON.stringify({
            userId: session.user.id,
            userName: session.user.name,
            changes: guestPermissions,
          }),
          userId: parseInt(session.user.id, 10),
        },
      })

      return successResponse(res, guestPermissions, '游客权限设置已更新')
    } catch (error) {
      console.error('更新游客权限设置失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新游客权限设置失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  else {
    return res.status(405).json({ 
      success: false, 
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } 
    })
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(handler)
