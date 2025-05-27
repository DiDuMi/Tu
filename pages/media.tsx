import { GetServerSideProps } from 'next'

// 将媒体库页面重定向到管理后台
export default function MediaRedirectPage() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 获取当前URL的查询参数
  const { categoryId, tagId, type, keyword, page, ...otherParams } = context.query

  // 构建重定向URL，保留查询参数
  const redirectQuery: any = {}
  
  // 保留所有查询参数
  if (categoryId) redirectQuery.categoryId = categoryId
  if (tagId) redirectQuery.tagId = tagId
  if (type) redirectQuery.type = type
  if (keyword) redirectQuery.keyword = keyword
  if (page) redirectQuery.page = page
  
  // 保留其他查询参数
  Object.assign(redirectQuery, otherParams)

  // 将查询参数转换为字符串
  const queryString = Object.entries(redirectQuery)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&')

  // 返回重定向到管理后台媒体管理页面
  return {
    redirect: {
      destination: `/admin/media${queryString ? `?${queryString}` : ''}`,
      permanent: true, // 永久重定向
    },
  }
}
