import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { signIn } from 'next-auth/react'
import Head from 'next/head'
import NewHomeSidebarLayout from '@/components/layout/NewHomeSidebarLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useFetch, useMutation } from '@/hooks/useFetch'
import LayoutSwitcher from '@/components/layout/LayoutSwitcher'
import { useUIStore } from '@/stores/uiStore'

interface SocialAccount {
  id: number
  provider: string
  providerId: string
  username?: string
  displayName?: string
  email?: string
  avatar?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
  providerName: string
  canUnlink: boolean
}

export default function Settings() {
  const [mounted, setMounted] = useState(false)
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null)
  const { homeLayoutMode, themeMode, themeColor } = useUIStore()

  // 获取社交账号列表
  const { data: socialAccountsData, error: socialAccountsError, isLoading: socialAccountsLoading, mutate } = useFetch<SocialAccount[]>(
    mounted ? '/api/v1/users/me/social-accounts' : null
  )

  // 解除关联API
  const { delete: unlinkAccount, loading: unlinkLoading } = useMutation('/api/v1/users/me/social-accounts')

  useEffect(() => {
    setMounted(true)

    // 加载Telegram Widget
    if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.setAttribute('data-telegram-login', process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username')
      script.setAttribute('data-size', 'medium')
      script.setAttribute('data-radius', '10')
      script.setAttribute('data-auth-url', `${window.location.origin}/api/auth/telegram`)
      script.setAttribute('data-request-access', 'write')
      script.async = true

      const container = document.getElementById('telegram-login-widget')
      if (container && !container.hasChildNodes()) {
        container.appendChild(script)
      }
    }
  }, [])

  // 处理社交账号关联
  const handleSocialLink = async (provider: string) => {
    try {
      await signIn(provider, {
        callbackUrl: '/dashboard/settings',
      })
    } catch (error) {
      console.error(`${provider}关联失败:`, error)
    }
  }

  // 处理解除关联
  const handleUnlink = async () => {
    if (!selectedAccount) return

    try {
      const result = await unlinkAccount({ provider: selectedAccount.provider })
      if (result.success) {
        mutate() // 刷新列表
        setUnlinkModalOpen(false)
        setSelectedAccount(null)
      }
    } catch (error) {
      console.error('解除关联失败:', error)
    }
  }

  // 获取社交平台图标
  const getSocialIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
        )
      case 'google':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        )
      case 'telegram':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.59c-.12.54-.44.67-.89.42l-2.46-1.81-1.19 1.14c-.13.13-.24.24-.49.24l.17-2.43 4.47-4.03c.19-.17-.04-.27-.3-.1L9.28 13.47l-2.38-.75c-.52-.16-.53-.52.11-.77l9.28-3.57c.43-.16.81.1.67.77z" />
          </svg>
        )
      default:
        return null
    }
  }

  if (!mounted) return null

  const socialAccounts = socialAccountsData?.success ? socialAccountsData.data : []

  return (
    <NewHomeSidebarLayout
      title="账号设置 - 兔图"
      description="管理您的账号设置和社交账号关联"
    >
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">账号设置</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理您的账号信息和社交账号关联
            </p>
          </div>

          {/* 社交账号管理 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>社交账号关联</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                关联社交账号后，您可以使用这些账号快速登录。建议至少关联一个社交账号或设置密码。
              </p>

              {socialAccountsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              ) : socialAccountsError ? (
                <Alert variant="error">
                  <AlertTitle>加载失败</AlertTitle>
                  <AlertDescription>
                    无法加载社交账号信息，请稍后重试
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* GitHub */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getSocialIcon('github')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">GitHub</p>
                        <p className="text-sm text-gray-500">使用GitHub账号登录</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {socialAccounts.find(account => account.provider === 'github') ? (
                        <>
                          <Badge variant="success">已关联</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const account = socialAccounts.find(a => a.provider === 'github')
                              if (account) {
                                setSelectedAccount(account)
                                setUnlinkModalOpen(true)
                              }
                            }}
                            disabled={!socialAccounts.find(a => a.provider === 'github')?.canUnlink}
                          >
                            解除关联
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSocialLink('github')}
                        >
                          关联账号
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Google */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getSocialIcon('google')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Google</p>
                        <p className="text-sm text-gray-500">使用Google账号登录</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {socialAccounts.find(account => account.provider === 'google') ? (
                        <>
                          <Badge variant="success">已关联</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const account = socialAccounts.find(a => a.provider === 'google')
                              if (account) {
                                setSelectedAccount(account)
                                setUnlinkModalOpen(true)
                              }
                            }}
                            disabled={!socialAccounts.find(a => a.provider === 'google')?.canUnlink}
                          >
                            解除关联
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSocialLink('google')}
                        >
                          关联账号
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getSocialIcon('telegram')}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Telegram</p>
                        <p className="text-sm text-gray-500">使用Telegram账号登录</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {socialAccounts.find(account => account.provider === 'telegram') ? (
                        <>
                          <Badge variant="success">已关联</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const account = socialAccounts.find(a => a.provider === 'telegram')
                              if (account) {
                                setSelectedAccount(account)
                                setUnlinkModalOpen(true)
                              }
                            }}
                            disabled={!socialAccounts.find(a => a.provider === 'telegram')?.canUnlink}
                          >
                            解除关联
                          </Button>
                        </>
                      ) : (
                        <div id="telegram-login-widget"></div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 界面设置 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>界面设置</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                个性化您的界面体验，选择适合您的布局和主题。
              </p>

              <div className="space-y-6">
                {/* 首页布局设置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">首页布局</h4>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        当前布局: {homeLayoutMode === 'sidebar' ? '侧边栏布局' : '默认布局'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {homeLayoutMode === 'sidebar'
                          ? '左侧垂直导航栏，功能集中便于访问'
                          : '传统顶部导航栏，简洁清爽'
                        }
                      </p>
                    </div>
                    <LayoutSwitcher />
                  </div>
                </div>

                {/* 主题设置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">主题设置</h4>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        当前主题: {themeMode === 'light' ? '亮色模式' : themeMode === 'dark' ? '暗色模式' : '跟随系统'}
                      </p>
                      <p className="text-sm text-gray-500">
                        主题颜色: {themeColor === 'blue' ? '蓝色' : themeColor === 'purple' ? '紫色' : themeColor === 'green' ? '绿色' : '橙色'}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      可在顶部导航栏切换
                    </div>
                  </div>
                </div>

                {/* 使用提示 */}
                <Alert>
                  <AlertTitle>💡 使用提示</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• 侧边栏布局提供更便捷的功能访问，适合频繁使用各种功能的用户</li>
                      <li>• 默认布局界面更简洁，适合主要浏览内容的用户</li>
                      <li>• 所有设置都会自动保存，下次访问时会记住您的选择</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 解除关联确认模态框 */}
        <Modal
          isOpen={unlinkModalOpen}
          onClose={() => setUnlinkModalOpen(false)}
          title="确认解除关联"
        >
          <ModalBody>
            <p>
              确定要解除与 <strong>{selectedAccount?.providerName}</strong> 的关联吗？
            </p>
            <p className="mt-2 text-sm text-gray-600">
              解除关联后，您将无法使用该社交账号登录。请确保您有其他登录方式。
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              onClick={() => setUnlinkModalOpen(false)}
              disabled={unlinkLoading}
            >
              取消
            </Button>
            <Button
              variant="error"
              onClick={handleUnlink}
              isLoading={unlinkLoading}
            >
              确认解除
            </Button>
          </ModalFooter>
        </Modal>
    </NewHomeSidebarLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/settings',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
