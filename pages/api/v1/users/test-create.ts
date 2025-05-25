import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'
import { withErrorHandler } from '@/lib/middleware'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' },
    })
  }

  try {
    console.log('接收到测试创建用户请求:', {
      body: {
        ...req.body,
        password: req.body.password ? '******' : undefined
      }
    })

    const { name, email, password, role, status, userGroupId } = req.body

    // 检查必填字段
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: '缺少必填字段',
          details: {
            name: !name ? '用户名是必填的' : undefined,
            email: !email ? '邮箱是必填的' : undefined,
            password: !password ? '密码是必填的' : undefined,
          }
        }
      })
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('邮箱已存在:', email)
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: '该邮箱已被注册',
        }
      })
    }

    // 创建用户
    const hashedPassword = await hash(password, 10)
    console.log('密码哈希完成，准备创建用户')
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'REGISTERED',
        status: status || 'ACTIVE',
        ...(userGroupId && { userGroupId: parseInt(userGroupId.toString()) }),
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })
    
    console.log('用户创建成功:', { userId: user.id, uuid: user.uuid })

    // 创建用户积分账户
    await prisma.userPoint.create({
      data: {
        userId: user.id,
        balance: 0,
        totalEarned: 0,
      },
    })
    
    console.log('用户积分账户创建成功')

    return res.status(201).json({
      success: true,
      data: user,
      message: '用户创建成功',
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    // 提供更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('错误详情:', {
      message: errorMessage,
      stack: errorStack
    })
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: '创建用户失败: ' + errorMessage,
      }
    })
  }
}

// 导出处理程序，但不使用任何中间件
export default withErrorHandler(handler)
