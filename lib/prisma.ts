import { PrismaClient } from '@prisma/client'
import { createExtendedPrismaClient } from './prisma-middleware'
import { applyQueryCacheMiddleware } from './query-cache'

// PrismaClient是一个重量级对象，不应该在每次请求时都创建新实例
// 在开发环境中，Next.js的热重载会导致创建多个实例
// 这里我们确保只创建一个PrismaClient实例

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// 配置Prisma日志级别
// 可以通过环境变量PRISMA_LOG_LEVEL控制日志级别
// 可选值: 'all'(所有日志), 'query'(仅查询), 'error'(仅错误), 'warn'(警告和错误), 'info'(信息、警告和错误), 'none'(无日志)
const getPrismaLogLevels = () => {
  const logLevel = process.env.PRISMA_LOG_LEVEL || 'error'

  switch (logLevel) {
    case 'all':
      return ['query', 'info', 'warn', 'error']
    case 'query':
      return ['query']
    case 'error':
      return ['error']
    case 'warn':
      return ['warn', 'error']
    case 'info':
      return ['info', 'warn', 'error']
    case 'none':
      return []
    default:
      return ['error']
  }
}

// 创建PrismaClient实例
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: getPrismaLogLevels() as any,
  })

  // 应用扩展功能
  const clientWithExtensions = createExtendedPrismaClient(client)

  // 应用查询缓存中间件
  return applyQueryCacheMiddleware(clientWithExtensions)
}

// 导出单例PrismaClient实例
export const prisma = global.prisma || createPrismaClient()

// 在开发环境中保存到全局变量
if (process.env.NODE_ENV !== 'production') global.prisma = prisma
