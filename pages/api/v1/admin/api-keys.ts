import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import crypto from 'crypto'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 管理员API密钥管理
 * GET /api/v1/admin/api-keys - 获取所有API密钥列表
 * POST /api/v1/admin/api-keys - 为指定用户创建API密钥
 * DELETE /api/v1/admin/api-keys - 删除API密钥
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 验证用户登录状态
  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return errorResponse(res, 'UNAUTHORIZED', '请先登录', undefined, 401)
  }

  // 获取当前用户并验证管理员权限
  const currentUser = await prisma.user.findUnique({
    where: {
      email: session.user.email!
    },
    select: { id: true, role: true, deletedAt: true }
  })

  if (!currentUser || currentUser.deletedAt) {
    return errorResponse(res, 'USER_NOT_FOUND', '用户不存在', undefined, 404)
  }

  // 检查管理员权限
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'OPERATOR') {
    return errorResponse(res, 'FORBIDDEN', '权限不足，仅管理员可访问', undefined, 403)
  }

  if (req.method === 'GET') {
    try {
      // 获取所有API密钥列表（包含用户信息）
      const apiKeys = await prisma.apiKey.findMany({
        select: {
          id: true,
          uuid: true,
          keyName: true,
          permissions: true,
          isActive: true,
          expiresAt: true,
          lastUsedAt: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return successResponse(res, apiKeys)
    } catch (error) {
      console.error('获取API密钥列表失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '获取API密钥列表失败', undefined, 500)
    }
  }

  if (req.method === 'POST') {
    try {
      const { keyName, permissions, expiresAt, userId } = req.body

      // 验证输入
      if (!keyName || typeof keyName !== 'string' || keyName.trim().length === 0) {
        return errorResponse(res, 'INVALID_INPUT', '密钥名称不能为空', undefined, 400)
      }

      if (!userId || typeof userId !== 'number') {
        return errorResponse(res, 'INVALID_INPUT', '用户ID不能为空', undefined, 400)
      }

      if (!permissions || !Array.isArray(permissions)) {
        return errorResponse(res, 'INVALID_INPUT', '权限列表格式错误', undefined, 400)
      }

      // 验证权限列表
      const validPermissions = ['signin', 'read_profile', 'read_points']
      const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
      if (invalidPermissions.length > 0) {
        return errorResponse(res, 'INVALID_INPUT', `无效的权限: ${invalidPermissions.join(', ')}`, undefined, 400)
      }

      // 验证目标用户是否存在
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, deletedAt: true }
      })

      if (!targetUser || targetUser.deletedAt) {
        return errorResponse(res, 'USER_NOT_FOUND', '目标用户不存在', undefined, 404)
      }

      // 检查用户是否已有太多API密钥
      const existingKeysCount = await prisma.apiKey.count({
        where: { userId: targetUser.id, isActive: true }
      })

      if (existingKeysCount >= 10) {
        return errorResponse(res, 'LIMIT_EXCEEDED', '每个用户最多只能创建10个API密钥', undefined, 400)
      }

      // 生成API密钥
      const apiKey = crypto.randomBytes(32).toString('hex')
      const hashedApiKey = crypto.createHash('sha256').update(apiKey).digest('hex')

      // 处理过期时间
      let expirationDate: Date | null = null
      if (expiresAt) {
        expirationDate = new Date(expiresAt)
        if (expirationDate <= new Date()) {
          return errorResponse(res, 'INVALID_INPUT', '过期时间必须是未来时间', undefined, 400)
        }
      }

      // 创建API密钥记录
      const newApiKey = await prisma.apiKey.create({
        data: {
          userId: targetUser.id,
          keyName: keyName.trim(),
          apiKey: hashedApiKey,
          permissions: JSON.stringify(permissions),
          expiresAt: expirationDate
        },
        select: {
          id: true,
          uuid: true,
          keyName: true,
          permissions: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return successResponse(res, {
        ...newApiKey,
        apiKey: apiKey // 只在创建时返回明文密钥
      }, 'API密钥创建成功')
    } catch (error) {
      console.error('创建API密钥失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '创建API密钥失败', undefined, 500)
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { keyId } = req.body

      if (!keyId) {
        return errorResponse(res, 'INVALID_INPUT', '密钥ID不能为空', undefined, 400)
      }

      // 删除API密钥（软删除 - 设置为不活跃）
      const deletedKey = await prisma.apiKey.updateMany({
        where: {
          uuid: keyId
        },
        data: {
          isActive: false
        }
      })

      if (deletedKey.count === 0) {
        return errorResponse(res, 'NOT_FOUND', 'API密钥不存在', undefined, 404)
      }

      return successResponse(res, null, 'API密钥删除成功')
    } catch (error) {
      console.error('删除API密钥失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '删除API密钥失败', undefined, 500)
    }
  }

  // 不支持的请求方法
  return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
}

export default handler
