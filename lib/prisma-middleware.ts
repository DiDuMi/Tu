/**
 * Prisma扩展
 * 用于优化查询性能、记录查询日志和软删除功能
 */

import { PrismaClient } from '@prisma/client'

/**
 * 创建带有扩展功能的Prisma客户端
 * @param basePrisma 基础PrismaClient实例
 */
export function createExtendedPrismaClient(basePrisma: PrismaClient) {
  return basePrisma.$extends({
    name: 'performance-monitor',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const startTime = Date.now()
          const result = await query(args)
          const endTime = Date.now()
          const duration = endTime - startTime

          // 记录慢查询（超过100ms的查询）
          if (duration > 100) {
            console.warn(`慢查询: ${model}.${operation} - ${duration}ms`)
            console.warn(`查询参数: ${JSON.stringify(args)}`)
          }

          return result
        }
      }
    }
  })
    .$extends({
      name: 'soft-delete',
      query: {
        // 为支持软删除的模型添加扩展
        user: {
          delete: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          deleteMany: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          findMany: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findFirst: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findUnique: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          }
        },
        page: {
          delete: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          deleteMany: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          findMany: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findFirst: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findUnique: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          }
        },
        tag: {
          delete: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          deleteMany: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          findMany: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findFirst: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findUnique: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          }
        },
        comment: {
          delete: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          deleteMany: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          findMany: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findFirst: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findUnique: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          }
        },
        media: {
          delete: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          deleteMany: async ({ args, query }) => {
            return query({ ...args, data: { deletedAt: new Date() } } as any)
          },
          findMany: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findFirst: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          },
          findUnique: async ({ args, query }) => {
            return query({
              ...args,
              where: { ...args?.where, deletedAt: null }
            })
          }
        }
      }
    })
}
