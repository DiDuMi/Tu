import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { IncomingForm } from 'formidable'
import { parse as csvParse } from 'csv-parse/sync'
import fs from 'fs'
import { hash } from 'bcrypt'
import { z } from 'zod'

// 配置formidable不将文件保存到磁盘
export const config = {
  api: {
    bodyParser: false,
  },
}

// 用户数据验证模式
const userDataSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  role: z.enum(['GUEST', 'REGISTERED', 'MEMBER', 'ANNUAL_MEMBER', 'OPERATOR', 'ADMIN']).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']).optional(),
  userGroup: z.string().optional(),
})

// 生成随机密码
function generateRandomPassword(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  try {
    // 解析表单数据
    const form = new IncomingForm()
    
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve([fields, files])
      })
    })
    
    // 检查是否上传了文件
    if (!files.file) {
      return errorResponse(
        res,
        'FILE_REQUIRED',
        '请上传CSV或Excel文件',
        undefined,
        400
      )
    }
    
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    
    // 检查文件类型
    const fileExtension = file.originalFilename.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'csv') {
      return errorResponse(
        res,
        'INVALID_FILE_TYPE',
        '仅支持CSV文件格式',
        undefined,
        400
      )
    }
    
    // 读取文件内容
    const fileContent = fs.readFileSync(file.filepath, 'utf8')
    
    // 解析CSV数据
    const records = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
    
    // 获取所有用户组
    const userGroups = await prisma.userGroup.findMany({
      select: {
        id: true,
        name: true,
      },
    })
    
    // 用户组名称到ID的映射
    const userGroupMap = new Map(userGroups.map(group => [group.name.toLowerCase(), group.id]))
    
    // 处理结果统计
    const result = {
      total: records.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    }
    
    // 处理每条记录
    for (const record of records) {
      try {
        // 验证数据
        const validationResult = userDataSchema.safeParse(record)
        
        if (!validationResult.success) {
          const errorMessage = `行 ${records.indexOf(record) + 2}: ${validationResult.error.message}`
          result.errors.push(errorMessage)
          result.failed++
          continue
        }
        
        const { name, email, role = 'REGISTERED', status = 'PENDING', userGroup } = validationResult.data
        
        // 查找用户组ID
        let userGroupId = null
        if (userGroup) {
          userGroupId = userGroupMap.get(userGroup.toLowerCase()) || null
        }
        
        // 检查用户是否已存在
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, deletedAt: true },
        })
        
        if (existingUser) {
          if (existingUser.deletedAt) {
            // 如果用户已被软删除，恢复用户
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name,
                role,
                status,
                userGroupId,
                deletedAt: null,
                updatedAt: new Date(),
              },
            })
          } else {
            // 更新现有用户
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name,
                role,
                status,
                userGroupId,
                updatedAt: new Date(),
              },
            })
          }
        } else {
          // 创建新用户
          const password = generateRandomPassword()
          const hashedPassword = await hash(password, 10)
          
          const newUser = await prisma.user.create({
            data: {
              name,
              email,
              password: hashedPassword,
              role,
              status,
              userGroupId,
            },
          })
          
          // 创建用户积分账户
          await prisma.userPoint.create({
            data: {
              userId: newUser.id,
              balance: 0,
              totalEarned: 0,
            },
          })
          
          // TODO: 发送包含随机密码的邮件给新用户
          console.log(`新用户 ${email} 的密码: ${password}`)
        }
        
        result.success++
      } catch (error) {
        const errorMessage = `行 ${records.indexOf(record) + 2}: ${(error as Error).message}`
        result.errors.push(errorMessage)
        result.failed++
      }
    }
    
    return successResponse(res, result, `成功导入 ${result.success} 个用户，失败 ${result.failed} 个`)
  } catch (error) {
    console.error('导入用户数据失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '导入用户数据失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
