/**
 * Prisma中间件
 * 用于优化查询性能、记录查询日志等
 */

import { PrismaClient } from '@prisma/client'

/**
 * 应用Prisma中间件
 * @param prisma PrismaClient实例
 */
export function applyPrismaMiddleware(prisma: PrismaClient) {
  // 查询性能监控中间件
  prisma.$use(async (params, next) => {
    const startTime = Date.now()
    const result = await next(params)
    const endTime = Date.now()
    const duration = endTime - startTime

    // 记录慢查询（超过100ms的查询）
    if (duration > 100) {
      console.warn(`慢查询: ${params.model}.${params.action} - ${duration}ms`)
      console.warn(`查询参数: ${JSON.stringify(params.args)}`)
    }

    return result
  })

  // 软删除中间件
  prisma.$use(async (params, next) => {
    // 只对有deletedAt字段的模型应用软删除
    // 根据schema.prisma，以下模型有deletedAt字段
    const modelsWithSoftDelete = ['User', 'Page', 'Comment', 'Media', 'MediaCategory', 'MediaTag', 'Tag', 'ContentTemplate']

    console.log(`[Prisma中间件] 当前操作: ${params.model}.${params.action}`)

    // 如果当前模型支持软删除且模型名称存在
    if (params.model && modelsWithSoftDelete.includes(params.model)) {
      // 处理删除操作，转换为软删除
      if (params.action === 'delete') {
        // 将delete操作转换为update操作
        params.action = 'update'
        params.args.data = { deletedAt: new Date() }
      }

      // 处理deleteMany操作，转换为updateMany操作
      if (params.action === 'deleteMany') {
        // 将deleteMany操作转换为updateMany操作
        params.action = 'updateMany'
        if (params.args.data) {
          params.args.data.deletedAt = new Date()
        } else {
          params.args.data = { deletedAt: new Date() }
        }
      }

      // 处理查询操作，自动过滤已软删除的记录
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        try {
          // 将findUnique操作转换为findFirst操作
          params.action = 'findFirst'
          // 添加deletedAt为null的条件
          if (params.args && params.args.where) {
            params.args.where.deletedAt = null
          }
        } catch (error) {
          console.error(`[Prisma中间件] 处理${params.model}.${params.action}时出错:`, error)
        }
      }

      if (params.action === 'findMany') {
        try {
          // 如果没有where条件，添加一个空的where条件
          if (!params.args) {
            params.args = {}
          }

          if (!params.args.where) {
            params.args.where = {}
          }

          // 添加deletedAt为null的条件
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null
          }
        } catch (error) {
          console.error(`[Prisma中间件] 处理${params.model}.${params.action}时出错:`, error)
        }
      }
    }

    return next(params)
  })

  return prisma
}
