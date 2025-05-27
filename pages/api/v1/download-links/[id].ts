import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { encrypt, decrypt } from '@/lib/encryption'
import { DOWNLOAD_PLATFORMS, validateDownloadUrl } from '@/lib/download-platforms'

// 更新下载链接验证模式
const updateDownloadLinkSchema = z.object({
  platform: z.string().min(1, '请选择网盘平台').optional(),
  url: z.string().url('请输入有效的下载链接').optional(),
  extractCode: z.string().optional(),
  pointCost: z.number().min(0, '积分不能为负数').max(10000, '积分不能超过10000').optional(),
  title: z.string().min(1, '请输入链接标题').max(100, '标题不能超过100个字符').optional(),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional()
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const { id } = req.query

  if (!session) {
    return errorResponse(res, 'UNAUTHORIZED', '请先登录', undefined, 401)
  }

  if (!id || Array.isArray(id)) {
    return errorResponse(res, 'INVALID_PARAMETER', '无效的下载链接ID', undefined, 400)
  }

  // 查找下载链接
  const downloadLink = await prisma.downloadLink.findFirst({
    where: {
      OR: [
        { id: isNaN(Number(id)) ? undefined : Number(id) },
        { uuid: id }
      ],
      deletedAt: null
    },
    include: {
      page: {
        select: { id: true, userId: true, title: true }
      }
    }
  })

  if (!downloadLink) {
    return errorResponse(res, 'DOWNLOAD_LINK_NOT_FOUND', '下载链接不存在', undefined, 404)
  }

  const currentUserId = parseInt(session.user.id, 10)
  const isOwner = downloadLink.userId === currentUserId

  // GET - 获取下载链接详情
  if (req.method === 'GET') {
    try {
      const linkData = {
        id: downloadLink.id,
        uuid: downloadLink.uuid,
        platform: downloadLink.platform,
        pointCost: downloadLink.pointCost,
        title: downloadLink.title,
        description: downloadLink.description,
        isActive: downloadLink.isActive,
        sortOrder: downloadLink.sortOrder,
        createdAt: downloadLink.createdAt,
        // 只有创建者才能看到敏感信息
        ...(isOwner ? {
          url: decrypt(downloadLink.url),
          extractCode: downloadLink.extractCode ? decrypt(downloadLink.extractCode) : null
        } : {})
      }

      return successResponse(res, linkData)
    } catch (error) {
      console.error('获取下载链接详情失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '获取下载链接详情失败', undefined, 500)
    }
  }

  // PUT - 更新下载链接
  if (req.method === 'PUT') {
    // 只有创建者可以更新
    if (!isOwner) {
      return errorResponse(res, 'PERMISSION_DENIED', '只有创建者可以更新下载链接', undefined, 403)
    }

    try {
      const validationResult = updateDownloadLinkSchema.safeParse(req.body)
      if (!validationResult.success) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          '请求数据验证失败',
          validationResult.error.format(),
          422
        )
      }

      const updateData = validationResult.data

      // 验证平台
      if (updateData.platform) {
        const supportedPlatforms = DOWNLOAD_PLATFORMS.map(p => p.id)
        if (!supportedPlatforms.includes(updateData.platform)) {
          return errorResponse(res, 'INVALID_PLATFORM', '不支持的网盘平台', undefined, 400)
        }
      }

      // 验证URL
      if (updateData.url && !validateDownloadUrl(updateData.url)) {
        return errorResponse(res, 'INVALID_URL', '无效的下载链接格式', undefined, 400)
      }

      // 准备更新数据
      const dataToUpdate: any = {}
      
      if (updateData.platform !== undefined) dataToUpdate.platform = updateData.platform
      if (updateData.url !== undefined) dataToUpdate.url = encrypt(updateData.url)
      if (updateData.extractCode !== undefined) {
        dataToUpdate.extractCode = updateData.extractCode ? encrypt(updateData.extractCode) : null
      }
      if (updateData.pointCost !== undefined) dataToUpdate.pointCost = updateData.pointCost
      if (updateData.title !== undefined) dataToUpdate.title = updateData.title
      if (updateData.description !== undefined) dataToUpdate.description = updateData.description
      if (updateData.isActive !== undefined) dataToUpdate.isActive = updateData.isActive
      if (updateData.sortOrder !== undefined) dataToUpdate.sortOrder = updateData.sortOrder

      const updatedLink = await prisma.downloadLink.update({
        where: { id: downloadLink.id },
        data: {
          ...dataToUpdate,
          updatedAt: new Date()
        },
        select: {
          id: true,
          uuid: true,
          platform: true,
          pointCost: true,
          title: true,
          description: true,
          isActive: true,
          sortOrder: true,
          updatedAt: true
        }
      })

      return successResponse(res, updatedLink, '下载链接更新成功')
    } catch (error) {
      console.error('更新下载链接失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '更新下载链接失败', undefined, 500)
    }
  }

  // DELETE - 删除下载链接（软删除）
  if (req.method === 'DELETE') {
    // 只有创建者可以删除
    if (!isOwner) {
      return errorResponse(res, 'PERMISSION_DENIED', '只有创建者可以删除下载链接', undefined, 403)
    }

    try {
      await prisma.downloadLink.update({
        where: { id: downloadLink.id },
        data: {
          deletedAt: new Date()
        }
      })

      return successResponse(res, null, '下载链接删除成功')
    } catch (error) {
      console.error('删除下载链接失败:', error)
      return errorResponse(res, 'SERVER_ERROR', '删除下载链接失败', undefined, 500)
    }
  }

  return errorResponse(res, 'METHOD_NOT_ALLOWED', '不支持的请求方法', undefined, 405)
}

export default handler
