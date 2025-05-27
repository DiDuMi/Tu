import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { successResponse, errorResponse } from '@/lib/api'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

/**
 * 修复视频文件问题
 * 1. 重命名包含特殊字符的文件
 * 2. 更新数据库中的URL
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  try {
    const { mediaId, action } = req.body

    if (!mediaId) {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '缺少媒体ID',
        undefined,
        400
      )
    }

    // 查找媒体记录
    const media = await prisma.media.findUnique({
      where: { id: parseInt(mediaId) }
    })

    if (!media) {
      return errorResponse(
        res,
        'MEDIA_NOT_FOUND',
        '媒体文件不存在',
        undefined,
        404
      )
    }

    const currentPath = path.join(process.cwd(), 'public', media.url)

    // 检查文件是否存在
    try {
      await fs.access(currentPath)
    } catch (error) {
      return errorResponse(
        res,
        'FILE_NOT_FOUND',
        '物理文件不存在',
        undefined,
        404
      )
    }

    if (action === 'rename') {
      // 生成新的安全文件名
      const originalExt = path.extname(media.url)
      const timestamp = Date.now()
      const safeFilename = `video_${timestamp}${originalExt}`

      // 构建新路径
      const dir = path.dirname(currentPath)
      const newPath = path.join(dir, safeFilename)
      const newUrl = media.url.replace(path.basename(media.url), safeFilename)

      // 重命名文件
      await fs.rename(currentPath, newPath)

      // 更新数据库
      await prisma.media.update({
        where: { id: media.id },
        data: {
          url: newUrl,
          title: media.title?.replace(/[^\w\s\-._]/g, '_') || media.url // 同时清理标题
        }
      })

      return successResponse(res, {
        oldUrl: media.url,
        newUrl: newUrl,
        oldPath: currentPath,
        newPath: newPath,
        message: '文件重命名成功'
      })
    }

    if (action === 'analyze') {
      // 分析文件问题
      const stats = await fs.stat(currentPath)
      const hasSpecialChars = /[^\w\-._/]/.test(media.url)
      const hasChinese = /[\u4e00-\u9fa5]/.test(media.url)
      const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(media.url)

      return successResponse(res, {
        media: {
          id: media.id,
          title: media.title,
          url: media.url,
          mimeType: media.mimeType,
          type: media.type
        },
        file: {
          exists: true,
          size: stats.size,
          path: currentPath
        },
        issues: {
          hasSpecialChars,
          hasChinese,
          hasEmoji,
          needsRename: hasSpecialChars || hasChinese || hasEmoji
        },
        suggestions: [
          ...(hasSpecialChars ? ['文件名包含特殊字符，建议重命名'] : []),
          ...(hasChinese ? ['文件名包含中文字符，可能影响某些浏览器'] : []),
          ...(hasEmoji ? ['文件名包含Emoji，建议重命名'] : []),
          ...(media.mimeType !== 'video/mp4' ? ['MIME类型不是video/mp4，可能影响兼容性'] : [])
        ]
      })
    }

    return errorResponse(
      res,
      'INVALID_ACTION',
      '无效的操作类型',
      undefined,
      400
    )

  } catch (error) {
    console.error('修复视频失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '修复视频失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default withErrorHandler(withAuth(handler))
