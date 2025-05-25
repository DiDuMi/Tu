import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types/api'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<any>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '只允许GET请求'
      }
    })
  }

  try {
    // 获取用户总数
    const userCount = await prisma.user.count({
      where: {
        deletedAt: null
      }
    })

    // 获取内容总数
    const contentCount = await prisma.page.count({
      where: {
        deletedAt: null,
        status: 'PUBLISHED'
      }
    })

    // 获取总浏览量
    const viewCountResult = await prisma.page.aggregate({
      where: {
        deletedAt: null,
        status: 'PUBLISHED'
      },
      _sum: {
        viewCount: true
      }
    })
    const viewCount = viewCountResult._sum.viewCount || 0

    // 获取总评论数
    const commentCount = await prisma.comment.count({
      where: {
        deletedAt: null
      }
    })

    // 返回统计数据
    return res.status(200).json({
      success: true,
      data: {
        userCount,
        contentCount,
        viewCount,
        commentCount
      }
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '获取统计数据失败'
      }
    })
  }
}
