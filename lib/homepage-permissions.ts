import { Session } from 'next-auth'

/**
 * 首页分类权限相关的工具函数
 */

// 首页分类映射
export const HOMEPAGE_CATEGORIES = {
  featured: 'featured',
  latest: 'latest',
  archive: 'archive',
  trending: 'trending'
} as const

export type HomepageCategory = keyof typeof HOMEPAGE_CATEGORIES

// 分类slug到权限操作的映射
export const CATEGORY_SLUG_TO_PERMISSION: Record<string, HomepageCategory> = {
  'featured': 'featured',
  'latest': 'latest',
  'archive': 'archive',
  'trending': 'trending'
}

/**
 * 检查用户是否有权限发布到指定的首页分类
 * @param session 用户会话
 * @param categorySlug 分类slug
 * @returns 是否有权限
 */
export function hasHomepagePublishPermission(
  session: Session | null,
  categorySlug: string
): boolean {
  // 未登录用户没有权限发布到任何分类
  if (!session) {
    return false
  }

  // 管理员和操作员默认拥有所有权限
  if (session.user.role === 'ADMIN' || session.user.role === 'OPERATOR') {
    return true
  }

  // 检查是否是首页分类
  const permissionAction = CATEGORY_SLUG_TO_PERMISSION[categorySlug]
  if (!permissionAction) {
    // 不是首页分类，允许发布
    return true
  }

  // 检查用户组权限
  const userGroup = (session.user as any).userGroup
  if (!userGroup || !userGroup.permissions) {
    return false
  }

  // 解析权限
  const permissions = typeof userGroup.permissions === 'string'
    ? JSON.parse(userGroup.permissions)
    : userGroup.permissions

  // 检查是否有对应的首页分类权限
  return permissions.homepage?.includes(permissionAction) || false
}

/**
 * 获取用户可以发布的首页分类列表
 * @param session 用户会话
 * @returns 可发布的分类slug数组
 */
export function getAvailableHomepageCategories(session: Session | null): string[] {
  // 未登录用户没有权限
  if (!session) {
    return []
  }

  // 管理员和操作员拥有所有权限
  if (session.user.role === 'ADMIN' || session.user.role === 'OPERATOR') {
    return Object.keys(CATEGORY_SLUG_TO_PERMISSION)
  }

  // 检查用户组权限
  const userGroup = (session.user as any).userGroup
  if (!userGroup || !userGroup.permissions) {
    return []
  }

  // 解析权限
  const permissions = typeof userGroup.permissions === 'string'
    ? JSON.parse(userGroup.permissions)
    : userGroup.permissions

  const homepagePermissions = permissions.homepage || []

  // 返回有权限的分类slug
  return Object.entries(CATEGORY_SLUG_TO_PERMISSION)
    .filter(([_slug, permission]) => homepagePermissions.includes(permission))
    .map(([slug, _permission]) => slug)
}

/**
 * 检查分类是否是首页分类
 * @param categorySlug 分类slug
 * @returns 是否是首页分类
 */
export function isHomepageCategory(categorySlug: string): boolean {
  return categorySlug in CATEGORY_SLUG_TO_PERMISSION
}

/**
 * 获取首页分类的显示名称
 * @param categorySlug 分类slug
 * @returns 显示名称
 */
export function getHomepageCategoryDisplayName(categorySlug: string): string {
  const nameMap: Record<string, string> = {
    'featured': '精选内容',
    'latest': '近期流出',
    'archive': '往期补档',
    'trending': '热门推荐'
  }

  return nameMap[categorySlug] || categorySlug
}

/**
 * 为用户组设置默认的首页分类权限
 * @param role 用户角色
 * @returns 默认权限配置
 */
export function getDefaultHomepagePermissions(role: string): string[] {
  switch (role) {
    case 'ADMIN':
    case 'OPERATOR':
      // 管理员和操作员默认拥有所有首页分类权限
      return ['featured', 'latest', 'archive', 'trending']

    case 'MEMBER':
    case 'ANNUAL_MEMBER':
      // 会员可以发布到部分分类
      return ['latest']

    case 'REGISTERED':
    default:
      // 普通用户默认没有首页分类权限
      return []
  }
}

/**
 * 验证首页分类权限配置
 * @param permissions 权限配置
 * @returns 是否有效
 */
export function validateHomepagePermissions(permissions: string[]): boolean {
  const validPermissions = Object.values(CATEGORY_SLUG_TO_PERMISSION)
  return permissions.every(permission => validPermissions.includes(permission as HomepageCategory))
}

/**
 * 游客权限配置
 * 游客是指未注册或未登录的用户
 */
export const GUEST_PERMISSIONS = {
  // 游客可以查看的内容
  canView: true,
  // 游客可以搜索内容
  canSearch: true,
  // 游客可以查看的内容状态
  allowedStatuses: ['PUBLISHED'],
  // 游客可以查看的分类（空数组表示可以查看所有公开分类）
  allowedCategories: [],
  // 游客不能发布到任何首页分类
  homepagePermissions: [],
  // 游客不能创建内容
  canCreateContent: false,
  // 游客不能评论
  canComment: false,
  // 游客不能点赞
  canLike: false,
  // 游客不能收藏
  canFavorite: false,
  // 游客的内容预览百分比
  previewPercentage: 30,
  // 游客的视频播放权限
  canPlayVideo: false
}

/**
 * 检查游客是否有指定权限
 * @param permission 权限名称
 * @returns 是否有权限
 */
export function hasGuestPermission(permission: keyof typeof GUEST_PERMISSIONS): boolean {
  return GUEST_PERMISSIONS[permission] as boolean
}

/**
 * 获取游客的内容预览百分比
 * @returns 预览百分比
 */
export function getGuestPreviewPercentage(): number {
  return GUEST_PERMISSIONS.previewPercentage
}

/**
 * 检查游客是否可以查看指定状态的内容
 * @param status 内容状态
 * @returns 是否可以查看
 */
export function canGuestViewStatus(status: string): boolean {
  return GUEST_PERMISSIONS.allowedStatuses.includes(status)
}
