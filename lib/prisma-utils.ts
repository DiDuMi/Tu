/**
 * Prisma查询优化工具函数
 */

import { PrismaClient } from '@prisma/client'

/**
 * 分页查询参数接口
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * 排序参数接口
 */
export interface SortParams {
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

/**
 * 分页查询结果接口
 */
export interface PaginatedResult<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * 执行分页查询
 * @param model Prisma模型
 * @param params 查询参数
 * @param where 查询条件
 * @param select 选择字段
 * @param orderBy 排序条件
 * @param include 包含关联
 * @returns 分页查询结果
 */
export async function paginatedQuery<T>(
  model: any,
  params: PaginationParams & SortParams,
  where: any = {},
  select?: any,
  orderBy?: any,
  include?: any
): Promise<PaginatedResult<T>> {
  const page = params.page || 1
  const limit = params.limit || 10
  
  // 构建排序条件
  let orderByParams = orderBy || {}
  if (params.sortField && !orderBy) {
    orderByParams = {
      [params.sortField]: params.sortDirection || 'desc'
    }
  }
  
  // 使用事务执行查询，减少数据库连接次数
  const [items, total] = await model.$transaction([
    // 查询数据列表
    model.findMany({
      where,
      ...(select ? { select } : {}),
      ...(include && !select ? { include } : {}),
      orderBy: orderByParams,
      skip: (page - 1) * limit,
      take: limit,
      // 添加缓存提示
      ...(process.env.NODE_ENV === 'production' ? { cacheStrategy: { ttl: 30 } } : {}),
    }),
    
    // 查询总数
    model.count({ where })
  ])
  
  // 计算总页数
  const totalPages = Math.ceil(total / limit)
  
  // 返回分页结果
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  }
}

/**
 * 批量创建或更新记录
 * @param model Prisma模型
 * @param data 数据数组
 * @param uniqueKey 唯一键
 * @returns 创建或更新的记录数组
 */
export async function batchUpsert<T>(
  model: any,
  data: any[],
  uniqueKey: string
): Promise<T[]> {
  if (!data || data.length === 0) {
    return []
  }
  
  // 使用事务执行批量操作
  return await model.$transaction(
    data.map((item: any) => 
      model.upsert({
        where: { [uniqueKey]: item[uniqueKey] },
        update: item,
        create: item
      })
    )
  )
}

/**
 * 安全查询单条记录
 * @param model Prisma模型
 * @param where 查询条件
 * @param select 选择字段
 * @param include 包含关联
 * @returns 查询结果或null
 */
export async function safeFind<T>(
  model: any,
  where: any,
  select?: any,
  include?: any
): Promise<T | null> {
  try {
    return await model.findFirst({
      where,
      ...(select ? { select } : {}),
      ...(include && !select ? { include } : {})
    })
  } catch (error) {
    console.error('查询失败:', error)
    return null
  }
}
