/**
 * 游客身份识别工具
 * 用于管理游客的身份标识，确保游客能看到自己的未审核评论
 */

import { v4 as uuidv4 } from 'uuid'

const GUEST_ID_KEY = 'tu_guest_id'
const GUEST_ID_EXPIRY_KEY = 'tu_guest_id_expiry'
const GUEST_ID_EXPIRY_DAYS = 30 // 游客ID有效期30天

/**
 * 获取或创建游客ID
 * @returns 游客ID字符串
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回临时ID
    return `temp_${uuidv4()}`
  }

  try {
    const existingId = localStorage.getItem(GUEST_ID_KEY)
    const expiry = localStorage.getItem(GUEST_ID_EXPIRY_KEY)

    // 检查是否有有效的游客ID
    if (existingId && expiry) {
      const expiryDate = new Date(expiry)
      if (expiryDate > new Date()) {
        return existingId
      }
    }

    // 创建新的游客ID
    const newGuestId = `guest_${uuidv4()}`
    const newExpiry = new Date()
    newExpiry.setDate(newExpiry.getDate() + GUEST_ID_EXPIRY_DAYS)

    localStorage.setItem(GUEST_ID_KEY, newGuestId)
    localStorage.setItem(GUEST_ID_EXPIRY_KEY, newExpiry.toISOString())

    return newGuestId
  } catch (error) {
    console.error('获取游客ID失败:', error)
    // 如果localStorage不可用，返回临时ID
    return `temp_${uuidv4()}`
  }
}

/**
 * 获取当前游客ID（不创建新的）
 * @returns 游客ID字符串或null
 */
export function getCurrentGuestId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const existingId = localStorage.getItem(GUEST_ID_KEY)
    const expiry = localStorage.getItem(GUEST_ID_EXPIRY_KEY)

    if (existingId && expiry) {
      const expiryDate = new Date(expiry)
      if (expiryDate > new Date()) {
        return existingId
      }
    }

    return null
  } catch (error) {
    console.error('获取游客ID失败:', error)
    return null
  }
}

/**
 * 清除游客ID
 */
export function clearGuestId(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(GUEST_ID_KEY)
    localStorage.removeItem(GUEST_ID_EXPIRY_KEY)
  } catch (error) {
    console.error('清除游客ID失败:', error)
  }
}

/**
 * 延长游客ID有效期
 */
export function extendGuestIdExpiry(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const existingId = localStorage.getItem(GUEST_ID_KEY)
    if (existingId) {
      const newExpiry = new Date()
      newExpiry.setDate(newExpiry.getDate() + GUEST_ID_EXPIRY_DAYS)
      localStorage.setItem(GUEST_ID_EXPIRY_KEY, newExpiry.toISOString())
    }
  } catch (error) {
    console.error('延长游客ID有效期失败:', error)
  }
}

/**
 * 检查是否为游客评论（基于游客ID）
 * @param comment 评论对象
 * @param currentGuestId 当前游客ID
 * @returns 是否为当前游客的评论
 */
export function isGuestComment(comment: any, currentGuestId: string | null): boolean {
  if (!currentGuestId || !comment.guestId) {
    return false
  }
  return comment.guestId === currentGuestId
}

/**
 * 检查评论是否对当前用户可见
 * @param comment 评论对象
 * @param userId 当前用户ID（如果已登录）
 * @param guestId 当前游客ID
 * @param isAdmin 是否为管理员
 * @returns 是否可见
 */
export function isCommentVisible(
  comment: any,
  userId: number | null,
  guestId: string | null,
  isAdmin: boolean = false
): boolean {
  // 管理员可以看到所有评论
  if (isAdmin) {
    return true
  }

  // 已通过审核的评论对所有人可见
  if (comment.status === 'APPROVED') {
    return true
  }

  // 待审核或被拒绝的评论只对评论者本人可见
  if (comment.status === 'PENDING' || comment.status === 'REJECTED') {
    // 注册用户的评论
    if (comment.userId && userId) {
      return comment.userId === userId
    }
    
    // 游客的评论
    if (comment.guestId && guestId) {
      return comment.guestId === guestId
    }
  }

  return false
}

/**
 * 过滤评论列表，只返回对当前用户可见的评论
 * @param comments 评论列表
 * @param userId 当前用户ID
 * @param guestId 当前游客ID
 * @param isAdmin 是否为管理员
 * @returns 过滤后的评论列表
 */
export function filterVisibleComments(
  comments: any[],
  userId: number | null,
  guestId: string | null,
  isAdmin: boolean = false
): any[] {
  return comments.filter(comment => 
    isCommentVisible(comment, userId, guestId, isAdmin)
  ).map(comment => ({
    ...comment,
    replies: comment.replies ? filterVisibleComments(comment.replies, userId, guestId, isAdmin) : []
  }))
}
