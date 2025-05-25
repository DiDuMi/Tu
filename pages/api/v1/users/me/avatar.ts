import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

// 禁用默认的body解析器，因为我们需要处理文件上传
export const config = {
  api: {
    bodyParser: false,
  },
}

// 确保上传目录存在
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '不支持的请求方法'
      }
    })
  }

  try {
    // 验证用户身份
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '请先登录'
        }
      })
    }

    const userEmail = session.user.email

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { 
        email: userEmail,
        deletedAt: null 
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      })
    }

    // 解析表单数据
    const form = formidable({
      uploadDir: uploadDir,
      keepExtensions: true,
      maxFileSize: 2 * 1024 * 1024, // 2MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image')
      }
    })

    const [fields, files] = await form.parse(req)
    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar

    if (!avatarFile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: '请选择要上传的头像文件'
        }
      })
    }

    // 生成新的文件名
    const fileExtension = path.extname(avatarFile.originalFilename || '.jpg')
    const fileName = `${user.uuid}-${Date.now()}${fileExtension}`
    const finalPath = path.join(uploadDir, fileName)

    try {
      // 使用Sharp处理图片：调整大小、压缩
      await sharp(avatarFile.filepath)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(finalPath)

      // 删除临时文件
      fs.unlinkSync(avatarFile.filepath)

      // 删除旧头像文件（如果存在）
      if (user.avatar) {
        const oldAvatarPath = path.join(process.cwd(), 'public', user.avatar)
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath)
        }
      }

      // 更新数据库中的头像路径
      const avatarUrl = `/uploads/avatars/${fileName}`
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar: avatarUrl,
          updatedAt: new Date()
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          role: true,
          image: true,
          avatar: true,
          bio: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        }
      })

      return res.status(200).json({
        success: true,
        data: {
          avatar: avatarUrl,
          user: updatedUser
        }
      })
    } catch (imageError) {
      console.error('图片处理失败:', imageError)
      
      // 清理临时文件
      if (fs.existsSync(avatarFile.filepath)) {
        fs.unlinkSync(avatarFile.filepath)
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'IMAGE_PROCESSING_ERROR',
          message: '图片处理失败'
        }
      })
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '文件大小不能超过2MB'
        }
      })
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: '请上传图片文件'
        }
      })
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '头像上传失败'
      }
    })
  }
}
