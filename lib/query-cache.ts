/**
 * 查询缓存工具
 * 用于缓存频繁查询的数据，减少数据库负载
 */

import { PrismaClient } from '@prisma/client'
import NodeCache from 'node-cache'

// 创建缓存实例
const queryCache = new NodeCache({
  stdTTL: 60, // 默认缓存60秒
  checkperiod: 120, // 每120秒检查过期的缓存
  useClones: false, // 不使用克隆，直接存储引用
})

// 缓存键前缀
const CACHE_PREFIX = 'prisma_query:'

/**
 * 生成缓存键
 * @param model 模型名称
 * @param action 操作类型
 * @param args 查询参数
 * @returns 缓存键
 */
function generateCacheKey(model: string, action: string, args: any): string {
  return `${CACHE_PREFIX}${model}:${action}:${JSON.stringify(args)}`
}

/**
 * 应用查询缓存中间件
 * @param prisma PrismaClient实例
 * @returns 应用了缓存中间件的PrismaClient实例
 */
export function applyQueryCacheMiddleware(prisma: PrismaClient): PrismaClient {
  // 可缓存的查询操作
  const cachableActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate']

  // 可缓存的模型 - 暂时禁用所有缓存，以排查问题
  const cachableModels: string[] = []
  // const cachableModels = ['Category', 'Tag', 'MediaCategory', 'MediaTag', 'UserGroup']

  // 查询缓存中间件
  prisma.$use(async (params, next) => {
    // 只缓存特定模型的特定操作
    if (params.model && params.action && cachableModels.includes(params.model) && cachableActions.includes(params.action)) {
      const cacheKey = generateCacheKey(params.model, params.action, params.args)

      // 尝试从缓存获取结果
      const cachedResult = queryCache.get(cacheKey)
      if (cachedResult !== undefined) {
        return cachedResult
      }

      // 如果缓存未命中，执行查询并缓存结果
      const result = await next(params)
      queryCache.set(cacheKey, result)
      return result
    }

    // 对于不可缓存的查询，直接执行
    return next(params)
  })

  return prisma
}

/**
 * 清除特定模型的缓存
 * @param model 模型名称
 */
export function clearModelCache(model: string): void {
  const keys = queryCache.keys()
  const modelKeys = keys.filter(key => key.startsWith(`${CACHE_PREFIX}${model}:`))
  queryCache.del(modelKeys)
}

/**
 * 清除所有查询缓存
 */
export function clearAllQueryCache(): void {
  queryCache.flushAll()
}

/**
 * 获取缓存统计信息
 * @returns 缓存统计信息
 */
export function getCacheStats(): any {
  return queryCache.getStats()
}
