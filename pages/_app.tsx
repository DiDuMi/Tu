import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/Toast'
import ThemeProvider from '@/components/layout/ThemeProvider'
import { AccessibilityProvider } from '@/components/ui/AccessibilityProvider'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // 初始化用户状态
  useEffect(() => {
    // 这里可以添加应用初始化逻辑
  }, [])

  return (
    <SessionProvider session={session}>
      <SWRConfig
        value={{
          fetcher: (url: string) => fetch(url).then(res => {
            if (!res.ok) {
              throw new Error(`API错误: ${res.status} ${res.statusText}`)
            }
            return res.json()
          }),
          // 启用焦点重新验证，当用户从其他页面返回时自动刷新数据
          revalidateOnFocus: true,
          // 启用挂载时重新验证，确保每次组件挂载时都获取最新数据
          revalidateOnMount: true,
          // 减少缓存时间，确保数据更新及时
          dedupingInterval: 5000, // 5秒
          onError: (error) => {
            console.error('SWR全局错误:', error)
          }
        }}
      >
        <ThemeProvider>
          <AccessibilityProvider>
            <Component {...pageProps} />
            <Toaster />
          </AccessibilityProvider>
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  )
}
