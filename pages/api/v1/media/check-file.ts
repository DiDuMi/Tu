import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { successResponse, errorResponse } from '@/lib/api'

/**
 * 检查媒体文件是否存在
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return errorResponse(
      res,
      'METHOD_NOT_ALLOWED',
      '不支持的请求方法',
      undefined,
      405
    )
  }

  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return errorResponse(
        res,
        'INVALID_REQUEST',
        '缺少文件URL参数',
        undefined,
        400
      )
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', url)
    
    try {
      // 检查文件是否存在
      const stats = await fs.stat(filePath)
      
      return successResponse(res, {
        exists: true,
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        mtime: stats.mtime,
        ctime: stats.ctime,
        path: filePath,
        url: url
      })
    } catch (error) {
      return successResponse(res, {
        exists: false,
        path: filePath,
        url: url,
        error: error instanceof Error ? error.message : '文件不存在'
      })
    }
  } catch (error) {
    console.error('检查文件失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '检查文件失败',
      error instanceof Error ? error.message : undefined,
      500
    )
  }
}

export default handler
