import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api'
import { z } from 'zod'

// 请求验证模式
const updateUserGroupSchema = z.object({
  name: z.string().min(2, '名称至少需要2个字符').max(50, '名称不能超过50个字符').optional(),
  description: z.string().optional().nullable(),
  permissions: z.record(z.array(z.string())).optional(),
  uploadLimits: z
    .object({
      maxFileSize: z.number().optional(),
      allowedTypes: z.array(z.string()).optional(),
    })
    .optional()
    .nullable(),
  previewPercentage: z.number().min(0).max(100).optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return errorResponse(
      res,
      'INVALID_PARAMETER',
      '无效的用户组ID',
      undefined,
      400
    )
  }

  // 查询用户组
  const userGroup = await prisma.userGroup.findFirst({
    where: {
      OR: [
        { id: isNaN(Number(id)) ? undefined : Number(id) },
        { uuid: id },
      ],
    },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  })

  if (!userGroup) {
    return notFoundResponse(res, '用户组不存在')
  }

  // 处理JSON字段
  const formattedUserGroup = {
    ...userGroup,
    permissions: JSON.parse(userGroup.permissions as string),
    uploadLimits: userGroup.uploadLimits ? JSON.parse(userGroup.uploadLimits as string) : null,
    userCount: userGroup._count.users,
    _count: undefined,
  }

  // GET方法：获取用户组详情
  if (req.method === 'GET') {
    return successResponse(res, formattedUserGroup)
  }

  // PUT方法：更新用户组
  if (req.method === 'PUT') {
    try {
      // 验证请求数据
      const validationResult = updateUserGroupSchema.safeParse(req.body)

      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const { name, description, permissions, uploadLimits, previewPercentage } = validationResult.data

      // 如果要更新名称，检查名称是否已被其他用户组使用
      if (name && name !== userGroup.name) {
        const existingGroup = await prisma.userGroup.findFirst({
          where: {
            name,
            id: { not: userGroup.id },
          },
        })

        if (existingGroup) {
          return errorResponse(
            res,
            'NAME_ALREADY_EXISTS',
            '该用户组名称已存在',
            undefined,
            409
          )
        }
      }

      // 准备更新数据
      const updateData: any = {}
      if (name) updateData.name = name
      if (description !== undefined) updateData.description = description
      if (permissions) updateData.permissions = JSON.stringify(permissions)
      if (uploadLimits !== undefined) updateData.uploadLimits = uploadLimits ? JSON.stringify(uploadLimits) : null
      if (previewPercentage !== undefined) updateData.previewPercentage = previewPercentage

      // 更新用户组
      const updatedUserGroup = await prisma.userGroup.update({
        where: { id: userGroup.id },
        data: updateData,
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
      })

      // 处理JSON字段
      const formattedUpdatedUserGroup = {
        ...updatedUserGroup,
        permissions: JSON.parse(updatedUserGroup.permissions as string),
        uploadLimits: updatedUserGroup.uploadLimits ? JSON.parse(updatedUserGroup.uploadLimits as string) : null,
        userCount: updatedUserGroup._count.users,
        _count: undefined,
      }

      return successResponse(res, formattedUpdatedUserGroup, '用户组更新成功')
    } catch (error) {
      console.error('更新用户组失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '更新用户组失败',
        undefined,
        500
      )
    }
  }

  // DELETE方法：删除用户组
  if (req.method === 'DELETE') {
    try {
      // 检查是否有用户关联到该用户组
      if (userGroup._count.users > 0) {
        return errorResponse(
          res,
          'GROUP_HAS_USERS',
          '该用户组下还有用户，无法删除',
          undefined,
          400
        )
      }

      // 删除用户组
      await prisma.userGroup.delete({
        where: { id: userGroup.id },
      })

      return successResponse(res, { id: userGroup.id }, '用户组删除成功')
    } catch (error) {
      console.error('删除用户组失败:', error)
      return errorResponse(
        res,
        'SERVER_ERROR',
        '删除用户组失败',
        undefined,
        500
      )
    }
  }

  // 不支持的方法
  return res.status(405).json({
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
  })
}

export default withErrorHandler(withOperator(handler))
