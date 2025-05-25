import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const mergeTagsSchema = z.object({
  sourceTagId: z.number().positive('源标签ID必须是正整数'),
  targetTagId: z.number().positive('目标标签ID必须是正整数'),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  try {
    // 验证请求数据
    const validationResult = mergeTagsSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { sourceTagId, targetTagId } = validationResult.data

    // 检查源标签和目标标签是否存在
    const sourceTag = await prisma.tag.findUnique({
      where: { id: sourceTagId, deletedAt: null },
    })

    const targetTag = await prisma.tag.findUnique({
      where: { id: targetTagId, deletedAt: null },
    })

    if (!sourceTag) {
      return errorResponse(res, 'NOT_FOUND', '源标签不存在', undefined, 404)
    }

    if (!targetTag) {
      return errorResponse(res, 'NOT_FOUND', '目标标签不存在', undefined, 404)
    }

    // 开始事务处理
    await prisma.$transaction(async (tx) => {
      // 1. 查找所有使用源标签的内容
      const pageTagsToUpdate = await tx.pageTag.findMany({
        where: { tagId: sourceTagId },
        select: { pageId: true, tagId: true },
      })

      // 2. 为每个内容添加目标标签（如果不存在）
      for (const pageTag of pageTagsToUpdate) {
        // 检查内容是否已经有目标标签
        const existingTargetTag = await tx.pageTag.findFirst({
          where: {
            pageId: pageTag.pageId,
            tagId: targetTagId,
          },
        })

        // 如果内容没有目标标签，则添加
        if (!existingTargetTag) {
          await tx.pageTag.create({
            data: {
              pageId: pageTag.pageId,
              tagId: targetTagId,
            },
          })
        }
      }

      // 3. 删除所有源标签关联
      await tx.pageTag.deleteMany({
        where: { tagId: sourceTagId },
      })

      // 4. 软删除源标签
      await tx.tag.update({
        where: { id: sourceTagId },
        data: { deletedAt: new Date() },
      })

      // 5. 更新目标标签的使用计数
      await tx.tag.update({
        where: { id: targetTagId },
        data: { 
          useCount: {
            increment: pageTagsToUpdate.length
          }
        },
      })
    })

    return successResponse(res, {
      success: true,
      sourceTag: sourceTag.name,
      targetTag: targetTag.name,
    }, '标签合并成功')
  } catch (error) {
    console.error('合并标签失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '合并标签失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
