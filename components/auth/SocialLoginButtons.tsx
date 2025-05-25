import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'

interface SocialLoginButtonsProps {
  callbackUrl?: string
  className?: string
}

export default function SocialLoginButtons({ callbackUrl = '/', className = '' }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  const handleSocialLogin = async (provider: string) => {
    try {
      setLoadingProvider(provider)
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(`${provider}登录失败:`, error)
    } finally {
      setLoadingProvider(null)
    }
  }

  const handleTelegramLogin = () => {
    // Telegram使用Widget，这里只是占位
    window.open('https://t.me/your_bot_username?start=login', '_blank')
  }

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {/* GitHub */}
      <Button
        type="button"
        variant="outline"
        onClick={() => handleSocialLogin('github')}
        disabled={loadingProvider !== null}
        isLoading={loadingProvider === 'github'}
        className="w-full"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
            clipRule="evenodd"
          />
        </svg>
        GitHub
      </Button>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        onClick={() => handleSocialLogin('google')}
        disabled={loadingProvider !== null}
        isLoading={loadingProvider === 'google'}
        className="w-full"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          />
        </svg>
        Google
      </Button>

      {/* Telegram */}
      <Button
        type="button"
        variant="outline"
        onClick={handleTelegramLogin}
        disabled={loadingProvider !== null}
        className="w-full"
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.59c-.12.54-.44.67-.89.42l-2.46-1.81-1.19 1.14c-.13.13-.24.24-.49.24l.17-2.43 4.47-4.03c.19-.17-.04-.27-.3-.1L9.28 13.47l-2.38-.75c-.52-.16-.53-.52.11-.77l9.28-3.57c.43-.16.81.1.67.77z"
          />
        </svg>
        Telegram
      </Button>
    </div>
  )
}

// Telegram Widget组件
interface TelegramLoginWidgetProps {
  botUsername: string
  authUrl: string
  size?: 'small' | 'medium' | 'large'
  radius?: number
  requestAccess?: boolean
  onAuth?: (user: any) => void
}

export function TelegramLoginWidget({
  botUsername,
  authUrl,
  size = 'medium',
  radius = 10,
  requestAccess = true,
  onAuth
}: TelegramLoginWidgetProps) {
  const widgetId = `telegram-login-${Math.random().toString(36).substr(2, 9)}`

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // 创建脚本元素
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.setAttribute('data-telegram-login', botUsername)
      script.setAttribute('data-size', size)
      script.setAttribute('data-radius', radius.toString())
      script.setAttribute('data-auth-url', authUrl)
      if (requestAccess) {
        script.setAttribute('data-request-access', 'write')
      }
      script.async = true

      // 如果提供了回调函数，设置全局回调
      if (onAuth) {
        const callbackName = `telegramLoginCallback_${widgetId}`
        ;(window as any)[callbackName] = onAuth
        script.setAttribute('data-onauth', callbackName)
      }

      // 添加到容器
      const container = document.getElementById(widgetId)
      if (container) {
        container.appendChild(script)
      }

      // 清理函数
      return () => {
        if (onAuth) {
          const callbackName = `telegramLoginCallback_${widgetId}`
          delete (window as any)[callbackName]
        }
      }
    }
  }, [botUsername, authUrl, size, radius, requestAccess, onAuth, widgetId])

  return <div id={widgetId} />
}
