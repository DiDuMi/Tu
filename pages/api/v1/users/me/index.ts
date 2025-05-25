import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 更新用户资料的验证模式
const updateProfileSchema = z.object({
  name: z.string().min(2, '用户名至少需要2个字符').max(50, '用户名不能超过50个字符').optional(),
  bio: z.string().max(200, '个人简介不能超过200个字符').optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === 'GET') {
      // 获取当前用户资料
      try {
        const user = await prisma.user.findUnique({
          where: { 
            email: userEmail,
            deletedAt: null 
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

        if (!user) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: '用户不存在'
            }
          })
        }

        return res.status(200).json({
          success: true,
          data: user
        })
      } catch (error) {
        console.error('获取用户资料失败:', error)
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '获取用户资料失败'
          }
        })
      }
    }

    if (req.method === 'PATCH') {
      // 更新用户资料
      try {
        // 验证请求数据
        const validatedData = updateProfileSchema.parse(req.body)

        // 检查用户是否存在
        const existingUser = await prisma.user.findUnique({
          where: { 
            email: userEmail,
            deletedAt: null 
          }
        })

        if (!existingUser) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: '用户不存在'
            }
          })
        }

        // 如果要更新用户名，检查是否重复
        if (validatedData.name && validatedData.name !== existingUser.name) {
          const nameExists = await prisma.user.findFirst({
            where: {
              name: validatedData.name,
              id: { not: existingUser.id },
              deletedAt: null
            }
          })

          if (nameExists) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'NAME_EXISTS',
                message: '用户名已存在'
              }
            })
          }
        }

        // 更新用户资料
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ...validatedData,
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
          data: updatedUser
        })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '数据验证失败',
              details: error.errors
            }
          })
        }

        console.error('更新用户资料失败:', error)
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '更新用户资料失败'
          }
        })
      }
    }

    // 不支持的请求方法
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '不支持的请求方法'
      }
    })
  } catch (error) {
    console.error('API处理失败:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '服务器内部错误'
      }
    })
  }
}
