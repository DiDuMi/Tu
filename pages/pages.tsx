import { GetServerSideProps } from 'next'

// 将 /pages 页面重定向到 /search 页面（内容库）
export default function PagesRedirectPage() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 获取当前URL的查询参数
  const { categoryId, tagId, keyword, page, ...otherParams } = context.query

  // 构建重定向URL，将参数转换为搜索页面的格式
  const redirectQuery: any = {}
  
  // 转换参数名称以匹配搜索页面的格式
  if (categoryId) redirectQuery.category = categoryId
  if (tagId) redirectQuery.tag = tagId
  if (keyword) redirectQuery.q = keyword
  if (page) redirectQuery.page = page
  
  // 保留其他查询参数
  Object.assign(redirectQuery, otherParams)

  // 将查询参数转换为字符串
  const queryString = Object.entries(redirectQuery)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&')

  // 返回重定向
  return {
    redirect: {
      destination: `/search${queryString ? `?${queryString}` : ''}`,
      permanent: true, // 永久重定向
    },
  }
}
