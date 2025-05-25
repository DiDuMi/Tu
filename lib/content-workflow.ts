/**
 * 内容工作流工具
 * 用于管理内容状态转换和审核流程
 */

import { prisma } from './prisma'
import { clearModelCache } from './query-cache'

// 内容状态类型
export type ContentStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'

// 内容状态转换权限
export const statusTransitionPermissions = {
  // 草稿状态可以转换为待审核或已发布（如果用户有直接发布权限）
  DRAFT: {
    PENDING_REVIEW: ['AUTHOR', 'EDITOR', 'ADMIN'],
    PUBLISHED: ['EDITOR', 'ADMIN'],
    ARCHIVED: ['AUTHOR', 'EDITOR', 'ADMIN'],
  },
  // 待审核状态可以转换为已发布或已拒绝
  PENDING_REVIEW: {
    PUBLISHED: ['EDITOR', 'ADMIN'],
    REJECTED: ['EDITOR', 'ADMIN'],
    DRAFT: ['AUTHOR', 'EDITOR', 'ADMIN'], // 允许退回到草稿状态
  },
  // 已发布状态可以转换为已归档
  PUBLISHED: {
    ARCHIVED: ['AUTHOR', 'EDITOR', 'ADMIN'],
    DRAFT: ['AUTHOR', 'EDITOR', 'ADMIN'], // 允许退回到草稿状态进行修改
  },
  // 已拒绝状态可以转换为草稿（重新编辑）
  REJECTED: {
    DRAFT: ['AUTHOR', 'EDITOR', 'ADMIN'],
  },
  // 已归档状态可以转换为草稿（重新启用）或已发布（直接重新发布）
  ARCHIVED: {
    DRAFT: ['AUTHOR', 'EDITOR', 'ADMIN'],
    PUBLISHED: ['EDITOR', 'ADMIN'],
  },
}

// 检查用户是否有权限进行状态转换
export function canTransitionStatus(
  currentStatus: ContentStatus,
  targetStatus: ContentStatus,
  userRole: string
): boolean {
  // 如果当前状态和目标状态相同，则不需要转换
  if (currentStatus === targetStatus) {
    return true
  }

  // 检查当前状态是否可以转换为目标状态
  const allowedRoles = (statusTransitionPermissions as any)[currentStatus]?.[targetStatus]

  if (!allowedRoles) {
    return false
  }

  // 检查用户角色是否有权限
  return allowedRoles.includes(userRole) || userRole === 'SUPER_ADMIN'
}

// 执行内容状态转换
export async function transitionContentStatus(
  contentId: number,
  targetStatus: ContentStatus,
  userId: number,
  feedback?: string
): Promise<{ success: boolean; message: string; content?: any }> {
  try {
    // 获取内容信息
    const content = await prisma.page.findUnique({
      where: { id: contentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!content) {
      return { success: false, message: '内容不存在' }
    }

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
      },
    })

    if (!user) {
      return { success: false, message: '用户不存在' }
    }

    // 检查权限
    if (!canTransitionStatus(content.status as ContentStatus, targetStatus, user.role)) {
      return { success: false, message: '没有权限执行此操作' }
    }

    // 使用事务执行状态转换
    const result = await prisma.$transaction(async (tx) => {
      // 更新内容状态
      const updatedContent = await tx.page.update({
        where: { id: contentId },
        data: {
          status: targetStatus,
          // 如果状态变为已发布，设置发布时间
          ...(targetStatus === 'PUBLISHED' && !content.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
      })

      // 如果提供了反馈，创建审核反馈记录
      if (feedback) {
        await tx.reviewFeedback.create({
          data: {
            content: feedback,
            status: targetStatus,
            pageId: contentId,
            reviewerId: userId,
          },
        })
      }

      // 记录系统日志
      await tx.systemLog.create({
        data: {
          level: 'INFO',
          module: 'CONTENT',
          action: `STATUS_CHANGE_TO_${targetStatus}`,
          message: `内容 "${content.title}" 状态从 ${content.status} 变更为 ${targetStatus}`,
          details: JSON.stringify({
            contentId,
            previousStatus: content.status,
            newStatus: targetStatus,
            feedback,
          }),
          userId,
        },
      })

      return updatedContent
    })

    // 清除内容缓存
    clearModelCache('Page')

    return {
      success: true,
      message: `内容状态已更新为 ${targetStatus}`,
      content: result,
    }
  } catch (error) {
    console.error('内容状态转换失败:', error)
    return { success: false, message: '内容状态转换失败' }
  }
}
