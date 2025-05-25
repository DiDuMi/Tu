/**
 * 媒体上传调试API
 * 用于诊断上传问题，提供详细的调试信息
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs/promises'
import path from 'path'
import { withErrorHandler, withAuth } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { getMediaType } from '@/lib/media'
import { flexibleValidateFilename, smartSanitizeFilename, FLEXIBLE_POLICY } from '@/lib/filename-utils-flexible'

// 配置formidable不将文件保存到磁盘
export const config = {
  api: {
    bodyParser: false,
  },
}

/**
 * 调试上传处理函数
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
    console.log('🔍 开始调试上传...')

    // 解析上传的文件
    const form = new IncomingForm({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
      allowEmptyFiles: false,
    })

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('❌ Formidable解析错误:', err)
          reject(err)
        }
        resolve([fields, files])
      })
    })

    console.log('📋 解析结果:')
    console.log('Fields:', Object.keys(fields))
    console.log('Files:', Object.keys(files))

    // 获取上传的文件
    const file = files.file?.[0]
    if (!file) {
      return errorResponse(
        res,
        'FILE_REQUIRED',
        '未提供文件',
        { fields, files },
        400
      )
    }

    console.log('📁 文件信息:')
    console.log('- 原始文件名:', file.originalFilename)
    console.log('- 临时路径:', file.filepath)
    console.log('- 文件大小:', file.size, 'bytes')
    console.log('- MIME类型:', file.mimetype)
    console.log('- 最后修改时间:', file.lastModifiedDate)

    // 检查文件是否存在
    let fileExists = false
    let fileStats = null
    try {
      fileStats = await fs.stat(file.filepath)
      fileExists = true
      console.log('✅ 临时文件存在')
      console.log('- 实际大小:', fileStats.size, 'bytes')
      console.log('- 创建时间:', fileStats.birthtime)
      console.log('- 修改时间:', fileStats.mtime)
    } catch (error) {
      console.log('❌ 临时文件不存在:', error)
    }

    // 文件扩展名检测
    const fileExtension = path.extname(file.originalFilename || '').toLowerCase()
    console.log('🔧 文件扩展名:', fileExtension)

    // MIME类型检测和修正
    const detectedMimeType = file.mimetype || ''
    let actualMimeType = detectedMimeType

    if (detectedMimeType === 'application/octet-stream' || !detectedMimeType) {
      console.log('⚠️ MIME类型需要修正')
      switch (fileExtension) {
        case '.mp4':
          actualMimeType = 'video/mp4'
          break
        case '.avi':
          actualMimeType = 'video/avi'
          break
        case '.mov':
          actualMimeType = 'video/quicktime'
          break
        case '.wmv':
          actualMimeType = 'video/x-ms-wmv'
          break
        case '.webm':
          actualMimeType = 'video/webm'
          break
        default:
          console.log('❓ 无法确定MIME类型')
          break
      }
      console.log('🔄 修正后MIME类型:', actualMimeType)
    }

    // 媒体类型检测
    const mediaType = getMediaType(actualMimeType)
    console.log('📺 媒体类型:', mediaType)

    // 文件名验证
    const originalFilename = file.originalFilename || 'unknown'
    const validation = flexibleValidateFilename(originalFilename, FLEXIBLE_POLICY)
    console.log('📝 文件名验证:')
    console.log('- 是否有效:', validation.isValid)
    console.log('- 严重程度:', validation.severity)
    console.log('- 问题:', validation.issues)
    console.log('- 建议:', validation.suggestions)

    if (!validation.isValid) {
      const safeFilename = smartSanitizeFilename(originalFilename, FLEXIBLE_POLICY)
      console.log('🔧 清理后文件名:', safeFilename)
    }

    // 支持的MIME类型检查
    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/quicktime',
      'video/x-msvideo', 'video/x-ms-wmv', 'video/3gpp', 'video/x-flv',
      'application/octet-stream',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac'
    ]

    const isTypeSupported = ALLOWED_MIME_TYPES.includes(actualMimeType)
    console.log('✅ 文件类型支持:', isTypeSupported)

    // 尝试读取文件头部信息
    let fileHeader = null
    if (fileExists) {
      try {
        const buffer = await fs.readFile(file.filepath)
        fileHeader = buffer.slice(0, 16).toString('hex')
        console.log('🔍 文件头部 (hex):', fileHeader)

        // 常见视频文件头部特征
        const videoSignatures = {
          'mp4': ['66747970', '00000018667479704d534e56', '00000020667479704d534e56'],
          'avi': ['52494646'],
          'mov': ['66747970717420', '6d6f6f76'],
          'wmv': ['3026b2758e66cf11'],
          'webm': ['1a45dfa3']
        }

        for (const [format, signatures] of Object.entries(videoSignatures)) {
          for (const sig of signatures) {
            if (fileHeader.toLowerCase().includes(sig)) {
              console.log(`🎯 检测到 ${format.toUpperCase()} 文件特征`)
              break
            }
          }
        }
      } catch (error) {
        console.log('❌ 无法读取文件头部:', error)
      }
    }

    // 清理临时文件
    if (fileExists) {
      try {
        await fs.unlink(file.filepath)
        console.log('🧹 临时文件已清理')
      } catch (error) {
        console.log('⚠️ 清理临时文件失败:', error)
      }
    }

    // 返回调试信息
    const debugInfo = {
      file: {
        originalFilename: file.originalFilename,
        size: file.size,
        detectedMimeType,
        actualMimeType,
        fileExtension,
        mediaType,
        lastModifiedDate: file.lastModifiedDate,
      },
      fileSystem: {
        exists: fileExists,
        stats: fileStats ? {
          size: fileStats.size,
          birthtime: fileStats.birthtime,
          mtime: fileStats.mtime,
        } : null,
        header: fileHeader,
      },
      validation: {
        filename: validation,
        typeSupported: isTypeSupported,
      },
      form: {
        fields: Object.keys(fields),
        files: Object.keys(files),
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      }
    }

    console.log('📊 调试完成')

    return successResponse(res, debugInfo, '调试信息收集完成')

  } catch (error) {
    console.error('💥 调试过程中发生错误:', error)
    return errorResponse(
      res,
      'DEBUG_FAILED',
      '调试失败',
      {
        error: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    )
  }
}

export default withErrorHandler(withAuth(handler))
