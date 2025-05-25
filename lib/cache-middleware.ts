import { NextApiRequest, NextApiResponse } from 'next'

type CacheControlOptions = {
  maxAge?: number // 缓存最大时间（秒）
  sMaxAge?: number // 共享缓存最大时间（秒）
  staleWhileRevalidate?: number // 过期后仍可使用的时间（秒）
  private?: boolean // 是否为私有缓存
  noCache?: boolean // 是否禁用缓存
  noStore?: boolean // 是否禁止存储
  mustRevalidate?: boolean // 是否必须重新验证
}

/**
 * 设置缓存控制头的中间件
 * @param options 缓存控制选项
 */
export function withCache(options: CacheControlOptions = {}) {
  return function (handler: any) {
    return async function (req: NextApiRequest, res: NextApiResponse) {
      // 设置缓存控制头
      setCacheControlHeader(res, options)
      
      // 调用原始处理程序
      return handler(req, res)
    }
  }
}

/**
 * 设置缓存控制头
 * @param res NextApiResponse对象
 * @param options 缓存控制选项
 */
export function setCacheControlHeader(res: NextApiResponse, options: CacheControlOptions = {}) {
  const {
    maxAge = 0,
    sMaxAge,
    staleWhileRevalidate,
    private: isPrivate = false,
    noCache = false,
    noStore = false,
    mustRevalidate = false,
  } = options

  // 构建缓存控制指令
  const directives: string[] = []

  // 添加缓存可见性
  if (isPrivate) {
    directives.push('private')
  } else {
    directives.push('public')
  }

  // 添加缓存时间
  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`)
  }

  // 添加共享缓存时间
  if (sMaxAge !== undefined && sMaxAge > 0) {
    directives.push(`s-maxage=${sMaxAge}`)
  }

  // 添加过期后仍可使用的时间
  if (staleWhileRevalidate !== undefined && staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  // 添加其他指令
  if (noCache) {
    directives.push('no-cache')
  }

  if (noStore) {
    directives.push('no-store')
  }

  if (mustRevalidate) {
    directives.push('must-revalidate')
  }

  // 设置缓存控制头
  res.setHeader('Cache-Control', directives.join(', '))
}

/**
 * 为已发布内容设置缓存
 * @param res NextApiResponse对象
 */
export function setPublishedContentCache(res: NextApiResponse) {
  setCacheControlHeader(res, {
    maxAge: 300, // 5分钟
    sMaxAge: 600, // 10分钟
    staleWhileRevalidate: 3600, // 1小时
  })
}

/**
 * 为非发布内容设置缓存
 * @param res NextApiResponse对象
 */
export function setNonPublishedContentCache(res: NextApiResponse) {
  setCacheControlHeader(res, {
    noStore: true,
    noCache: true,
    mustRevalidate: true,
  })
}

/**
 * 为静态内容设置缓存
 * @param res NextApiResponse对象
 */
export function setStaticContentCache(res: NextApiResponse) {
  setCacheControlHeader(res, {
    maxAge: 86400, // 1天
    sMaxAge: 604800, // 1周
    staleWhileRevalidate: 86400, // 1天
  })
}

/**
 * 为动态内容设置缓存
 * @param res NextApiResponse对象
 */
export function setDynamicContentCache(res: NextApiResponse) {
  setCacheControlHeader(res, {
    maxAge: 60, // 1分钟
    sMaxAge: 300, // 5分钟
    staleWhileRevalidate: 3600, // 1小时
  })
}
