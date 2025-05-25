import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { withErrorHandler, withOperator } from '@/lib/middleware'
import { successResponse, errorResponse } from '@/lib/api'
import { z } from 'zod'
import { createObjectCsvStringifier } from 'csv-writer'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 请求验证模式
const exportSchema = z.object({
  fields: z.array(z.string()).min(1, '至少需要选择一个导出字段'),
  format: z.enum(['csv', 'excel']).default('csv'),
  filter: z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    role: z.string().optional(),
    userGroupId: z.number().optional(),
  }).optional(),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST方法
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: '方法不允许' } })
  }

  try {
    // 验证请求数据
    const validationResult = exportSchema.safeParse(req.body)

    if (!validationResult.success) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        '请求数据验证失败',
        validationResult.error.format(),
        422
      )
    }

    const { fields, format, filter } = validationResult.data

    // 构建查询条件
    const where = {
      deletedAt: null,
      ...(filter?.search && {
        OR: [
          { name: { contains: filter.search } },
          { email: { contains: filter.search } },
        ],
      }),
      ...(filter?.status && { status: filter.status }),
      ...(filter?.role && { role: filter.role }),
      ...(filter?.userGroupId && { userGroupId: filter.userGroupId }),
    }

    // 查询用户数据
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // 处理数据，确保只包含请求的字段
    const processedData = users.map(user => {
      const data: Record<string, any> = {}
      
      fields.forEach(field => {
        if (field === 'userGroup') {
          data[field] = user.userGroup?.name || ''
        } else if (field === 'createdAt' || field === 'updatedAt') {
          data[field] = user[field] ? new Date(user[field]).toISOString() : ''
        } else if (field in user) {
          data[field] = user[field as keyof typeof user] || ''
        }
      })
      
      return data
    })

    // 根据格式导出数据
    if (format === 'csv') {
      // 创建CSV列头
      const header = fields.map(field => ({
        id: field,
        title: field.charAt(0).toUpperCase() + field.slice(1),
      }))

      // 创建CSV字符串
      const csvStringifier = createObjectCsvStringifier({
        header,
      })

      const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(processedData)

      // 生成唯一文件名
      const fileName = `users_export_${new Date().toISOString().slice(0, 10)}_${uuidv4()}.csv`
      
      // 确保临时目录存在
      const tempDir = path.join(process.cwd(), 'public', 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      // 写入文件
      const filePath = path.join(tempDir, fileName)
      fs.writeFileSync(filePath, csvString)
      
      // 返回下载链接
      const downloadUrl = `/temp/${fileName}`
      
      return successResponse(res, { 
        downloadUrl,
        count: users.length,
      }, `成功导出 ${users.length} 个用户数据`)
    } else {
      // Excel格式导出（这里简化处理，实际项目中可以使用exceljs等库）
      return errorResponse(
        res,
        'NOT_IMPLEMENTED',
        'Excel格式导出暂未实现',
        undefined,
        501
      )
    }
  } catch (error) {
    console.error('导出用户数据失败:', error)
    return errorResponse(
      res,
      'SERVER_ERROR',
      '导出用户数据失败',
      undefined,
      500
    )
  }
}

// 使用中间件包装处理程序
export default withErrorHandler(withOperator(handler))
