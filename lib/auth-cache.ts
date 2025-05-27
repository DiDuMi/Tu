import { Session } from 'next-auth'
import { prisma } from './prisma'

// 用户权限缓存，避免重复查询
const userPermissionCache = new Map<string, {
  userGroup: any
  timestamp: number
}>()

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000

/**
 * 获取用户组信息（带缓存）
 * @param session 用户会话
 * @returns 用户组信息
 */
export async function getUserGroupWithCache(session: Session | null) {
  if (!session?.user?.id) {
    return null
  }

  const userId = session.user.id
  const cacheKey = `user-${userId}`
  const now = Date.now()

  // 检查缓存
  const cached = userPermissionCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_EXPIRY) {
    return cached.userGroup
  }

  try {
    // 从数据库查询用户组信息
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: {
        userGroupId: true,
        userGroup: {
          select: {
            id: true,
            name: true,
            previewPercentage: true,
            permissions: true,
          }
        }
      }
    })

    const userGroup = user?.userGroup || null

    // 更新缓存
    userPermissionCache.set(cacheKey, {
      userGroup,
      timestamp: now
    })

    return userGroup
  } catch (error) {
    console.error('获取用户组信息失败:', error)
    return null
  }
}

/**
 * 清除用户权限缓存
 * @param userId 用户ID
 */
export function clearUserPermissionCache(userId: string) {
  const cacheKey = `user-${userId}`
  userPermissionCache.delete(cacheKey)
}

/**
 * 清除所有权限缓存
 */
export function clearAllPermissionCache() {
  userPermissionCache.clear()
}

/**
 * 检查用户是否有特定权限（带缓存）
 * @param session 用户会话
 * @param permission 权限名称
 * @returns 是否有权限
 */
export async function hasPermissionWithCache(session: Session | null, permission: string): Promise<boolean> {
  if (!session?.user) {
    return false
  }

  // 管理员和操作员有所有权限
  if (session.user.role === 'ADMIN' || session.user.role === 'OPERATOR') {
    return true
  }

  const userGroup = await getUserGroupWithCache(session)
  if (!userGroup?.permissions) {
    return false
  }

  try {
    const permissions = typeof userGroup.permissions === 'string' 
      ? JSON.parse(userGroup.permissions) 
      : userGroup.permissions

    // 检查权限
    return Object.values(permissions).flat().includes(permission)
  } catch (error) {
    console.error('解析权限失败:', error)
    return false
  }
}

/**
 * 批量检查用户权限（带缓存）
 * @param session 用户会话
 * @param permissions 权限名称数组
 * @returns 权限检查结果对象
 */
export async function hasPermissionsWithCache(
  session: Session | null, 
  permissions: string[]
): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {}

  if (!session?.user) {
    permissions.forEach(permission => {
      result[permission] = false
    })
    return result
  }

  // 管理员和操作员有所有权限
  if (session.user.role === 'ADMIN' || session.user.role === 'OPERATOR') {
    permissions.forEach(permission => {
      result[permission] = true
    })
    return result
  }

  const userGroup = await getUserGroupWithCache(session)
  if (!userGroup?.permissions) {
    permissions.forEach(permission => {
      result[permission] = false
    })
    return result
  }

  try {
    const userPermissions = typeof userGroup.permissions === 'string' 
      ? JSON.parse(userGroup.permissions) 
      : userGroup.permissions

    const allPermissions = Object.values(userPermissions).flat() as string[]

    permissions.forEach(permission => {
      result[permission] = allPermissions.includes(permission)
    })

    return result
  } catch (error) {
    console.error('解析权限失败:', error)
    permissions.forEach(permission => {
      result[permission] = false
    })
    return result
  }
}

export type { Session }
