import { Session } from 'next-auth'

/**
 * 检查用户是否有特定角色
 * @param session 用户会话
 * @param roles 允许的角色数组
 * @returns 是否有权限
 */
export function hasRole(session: Session | null, roles: string[]): boolean {
  if (!session || !session.user) return false
  
  const userRole = session.user.role
  return roles.includes(userRole)
}

/**
 * 检查用户是否为管理员
 * @param session 用户会话
 * @returns 是否为管理员
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, ['ADMIN'])
}

/**
 * 检查用户是否为操作员或管理员
 * @param session 用户会话
 * @returns 是否为操作员或管理员
 */
export function isOperator(session: Session | null): boolean {
  return hasRole(session, ['OPERATOR', 'ADMIN'])
}

/**
 * 检查用户是否为会员或更高级别
 * @param session 用户会话
 * @returns 是否为会员或更高级别
 */
export function isMember(session: Session | null): boolean {
  return hasRole(session, ['MEMBER', 'ANNUAL_MEMBER', 'OPERATOR', 'ADMIN'])
}

/**
 * 检查用户是否为年度会员或更高级别
 * @param session 用户会话
 * @returns 是否为年度会员或更高级别
 */
export function isAnnualMember(session: Session | null): boolean {
  return hasRole(session, ['ANNUAL_MEMBER', 'OPERATOR', 'ADMIN'])
}

/**
 * 检查用户是否为资源所有者
 * @param session 用户会话
 * @param resourceUserId 资源所有者ID
 * @returns 是否为资源所有者
 */
export function isResourceOwner(session: Session | null, resourceUserId: string | number): boolean {
  if (!session || !session.user) return false
  
  const userId = session.user.id
  return userId === resourceUserId.toString()
}

/**
 * 检查用户是否有权限访问资源
 * @param session 用户会话
 * @param resourceUserId 资源所有者ID
 * @returns 是否有权限访问资源
 */
export function canAccessResource(session: Session | null, resourceUserId: string | number): boolean {
  // 管理员和操作员可以访问所有资源
  if (isOperator(session)) return true
  
  // 资源所有者可以访问自己的资源
  return isResourceOwner(session, resourceUserId)
}

/**
 * 检查用户是否有权限编辑资源
 * @param session 用户会话
 * @param resourceUserId 资源所有者ID
 * @returns 是否有权限编辑资源
 */
export function canEditResource(session: Session | null, resourceUserId: string | number): boolean {
  // 管理员可以编辑所有资源
  if (isAdmin(session)) return true
  
  // 操作员可以编辑所有资源
  if (isOperator(session)) return true
  
  // 资源所有者可以编辑自己的资源
  return isResourceOwner(session, resourceUserId)
}

/**
 * 检查用户是否有权限删除资源
 * @param session 用户会话
 * @param resourceUserId 资源所有者ID
 * @returns 是否有权限删除资源
 */
export function canDeleteResource(session: Session | null, resourceUserId: string | number): boolean {
  // 管理员可以删除所有资源
  if (isAdmin(session)) return true
  
  // 资源所有者可以删除自己的资源
  return isResourceOwner(session, resourceUserId)
}
