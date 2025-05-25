import { GetServerSideProps } from 'next'

// 将explore页面重定向到search页面
export default function ExplorePage() {
  return null
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // 获取当前URL的查询参数
  const { category, tag, sort } = context.query

  // 构建重定向URL
  const redirectUrl = {
    pathname: '/search',
    query: {
      ...(category ? { category } : {}),
      ...(tag ? { tag } : {}),
      ...(sort ? { sort } : {}),
    }
  }

  // 将查询参数转换为字符串
  const queryString = Object.entries(redirectUrl.query)
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
