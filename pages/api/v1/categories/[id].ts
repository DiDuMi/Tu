import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { generateCategorySlug } from '@/lib/content'

// 更新分类验证模式
const updateCategorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称不能超过50个字符'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.number().optional().nullable(),
  order: z.number().default(0),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      '无效的分类ID',
      undefined,
      422
    )
  }

  // 查找分类
  const category = await prisma.category.findUnique({
    where: { uuid: id },
  })

  if (!category) {
    return errorResponse(
      res,
      'NOT_FOUND',
      '分类不存在',
      undefined,
      404
    )
  }

  // GET 请求 - 获取分类详情
  if (req.method === 'GET') {
    try {
      // 查询分类详情（包含关联数据）
      const categoryDetail = await prisma.category.findUnique({
        where: { id: category.id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          children: {
            select: {
              id: true,
              uuid: true,
              name: true,
              slug: true,
              order: true,
              _count: {
                select: {
                  pages: true,
                  children: true,
                },
              },
            },
            orderBy: [
              { order: 'asc' },
              { name: 'asc' },
            ],
          },
          _count: {
            select: {
              pages: true,
              children: true,
            },
          },
        },
      })

      return successResponse(res, categoryDetail)
    } catch (error) {
      console.error('获取分类详情失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '获取分类详情失败',
        undefined,
        500
      )
    }
  }

  // PUT 请求 - 更新分类
  else if (req.method === 'PUT') {
    try {
      // 验证请求数据
      const validationResult = updateCategorySchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, slug, description, parentId, order } = validationResult.data

      // 检查父分类是否存在
      if (parentId) {
        // 不能将分类的父分类设置为自己
        if (parentId === category.id) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            '不能将分类的父分类设置为自己',
            undefined,
            422
          )
        }

        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
        })

        if (!parentCategory) {
          return errorResponse(
            res,
            'VALIDATION_ERROR',
            '父分类不存在',
            undefined,
            422
          )
        }

        // 检查是否会形成循环引用
        let currentParentId = parentId
        while (currentParentId) {
          const currentParent = await prisma.category.findUnique({
            where: { id: currentParentId },
            select: { parentId: true },
          })

          if (!currentParent) break

          if (currentParent.parentId === category.id) {
            return errorResponse(
              res,
              'VALIDATION_ERROR',
              '不能形成循环引用',
              undefined,
              422
            )
          }

          currentParentId = currentParent.parentId
        }
      }

      // 检查分类名称是否已存在（排除自己）
      const existingCategory = await prisma.category.findFirst({
        where: {
          name,
          id: { not: category.id },
        },
      })

      if (existingCategory) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '分类名称已存在',
          undefined,
          422
        )
      }

      // 生成 slug
      const categorySlug = slug || generateCategorySlug(name)

      // 检查 slug 是否已存在（排除自己）
      const existingSlug = await prisma.category.findFirst({
        where: {
          slug: categorySlug,
          id: { not: category.id },
        },
      })

      if (existingSlug) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '分类别名已存在',
          undefined,
          422
        )
      }

      // 更新分类
      const updatedCategory = await prisma.category.update({
        where: { id: category.id },
        data: {
          name,
          slug: categorySlug,
          description,
          parentId,
          order,
        },
      })

      // 查询更新后的分类（包含关联数据）
      const fullUpdatedCategory = await prisma.category.findUnique({
        where: { id: category.id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          children: {
            select: {
              id: true,
              uuid: true,
              name: true,
              slug: true,
              order: true,
            },
            orderBy: [
              { order: 'asc' },
              { name: 'asc' },
            ],
          },
          _count: {
            select: {
              pages: true,
              children: true,
            },
          },
        },
      })

      return successResponse(res, fullUpdatedCategory, '分类更新成功')
    } catch (error) {
      console.error('更新分类失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新分类失败',
        undefined,
        500
      )
    }
  }

  // DELETE 请求 - 删除分类
  else if (req.method === 'DELETE') {
    try {
      // 获取强制删除参数
      const forceDelete = req.query.force === 'true'

      // 再次检查分类是否存在
      const categoryToDelete = await prisma.category.findUnique({
        where: { id: category.id },
      })

      if (!categoryToDelete) {
        return errorResponse(
          res,
          'NOT_FOUND',
          '分类不存在或已被删除',
          undefined,
          404
        )
      }

      // 检查分类是否有子分类
      const childrenCount = await prisma.category.count({
        where: { parentId: category.id },
      })

      if (childrenCount > 0 && !forceDelete) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '无法删除有子分类的分类，请先删除或移动子分类',
          undefined,
          422
        )
      }

      // 检查分类是否有关联的内容
      const pagesCount = await prisma.page.count({
        where: { categoryId: category.id },
      })

      if (pagesCount > 0 && !forceDelete) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '无法删除有关联内容的分类，请先移除内容的分类关联',
          undefined,
          422
        )
      }

      // 使用事务确保删除操作的原子性
      const result = await prisma.$transaction(async (tx) => {
        // 如果是强制删除且有关联内容，先解除关联
        if (forceDelete && pagesCount > 0) {
          await tx.page.updateMany({
            where: { categoryId: category.id },
            data: { categoryId: null }
          })
          console.log(`已解除 ${pagesCount} 个内容与分类的关联`)
        }

        // 如果是强制删除且有子分类，将子分类的父分类设为null
        if (forceDelete && childrenCount > 0) {
          await tx.category.updateMany({
            where: { parentId: category.id },
            data: { parentId: null }
          })
          console.log(`已解除 ${childrenCount} 个子分类与父分类的关联`)
        }

        // 删除分类
        return await tx.category.delete({
          where: { id: category.id },
        })
      })

      console.log('分类删除成功:', {
        id: result.id,
        name: result.name,
        forceDelete
      })

      return successResponse(res, { id: result.id, uuid: result.uuid }, '分类删除成功')
    } catch (error) {
      console.error('删除分类失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '删除分类失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  else {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
