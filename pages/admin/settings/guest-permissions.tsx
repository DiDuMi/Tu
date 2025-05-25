import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { GUEST_PERMISSIONS } from '@/lib/homepage-permissions'

interface GuestPermissionSettings {
  canView: boolean
  canSearch: boolean
  allowedStatuses: string[]
  canCreateContent: boolean
  canComment: boolean
  canLike: boolean
  canFavorite: boolean
  previewPercentage: number
  canPlayVideo: boolean
}

export default function GuestPermissionsPage() {
  const [settings, setSettings] = useState<GuestPermissionSettings>({
    canView: GUEST_PERMISSIONS.canView,
    canSearch: GUEST_PERMISSIONS.canSearch,
    allowedStatuses: GUEST_PERMISSIONS.allowedStatuses,
    canCreateContent: GUEST_PERMISSIONS.canCreateContent,
    canComment: GUEST_PERMISSIONS.canComment,
    canLike: GUEST_PERMISSIONS.canLike,
    canFavorite: GUEST_PERMISSIONS.canFavorite,
    previewPercentage: GUEST_PERMISSIONS.previewPercentage,
    canPlayVideo: GUEST_PERMISSIONS.canPlayVideo,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 加载当前设置
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log('开始加载游客权限设置...')
      const response = await fetch('/api/v1/settings/guest-permissions')
      console.log('加载响应状态:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('加载响应数据:', data)
        if (data.success) {
          setSettings(data.data)
          console.log('设置已更新:', data.data)
        } else {
          console.error('API返回失败:', data.error)
          setMessage({ type: 'error', text: '加载设置失败: ' + (data.error?.message || '未知错误') })
        }
      } else {
        console.error('HTTP错误:', response.status)
        if (response.status === 401) {
          setMessage({ type: 'error', text: '权限不足，请确保您是管理员' })
        } else {
          setMessage({ type: 'error', text: `加载设置失败 (${response.status})` })
        }
      }
    } catch (error) {
      console.error('加载游客权限设置失败:', error)
      setMessage({ type: 'error', text: '加载设置时发生错误: ' + (error instanceof Error ? error.message : String(error)) })
    }
  }

  const handleSave = async () => {
    console.log('开始保存游客权限设置:', settings)
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/v1/settings/guest-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      console.log('API响应状态:', response.status)
      const data = await response.json()
      console.log('API响应数据:', data)

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: '游客权限设置已保存' })
        console.log('保存成功')
      } else {
        const errorMessage = data.error?.message || `保存失败 (${response.status})`
        setMessage({ type: 'error', text: errorMessage })
        console.error('保存失败:', errorMessage)
      }
    } catch (error) {
      console.error('保存时发生错误:', error)
      setMessage({ type: 'error', text: '保存时发生错误: ' + (error instanceof Error ? error.message : String(error)) })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setSettings({
      canView: GUEST_PERMISSIONS.canView,
      canSearch: GUEST_PERMISSIONS.canSearch,
      allowedStatuses: GUEST_PERMISSIONS.allowedStatuses,
      canCreateContent: GUEST_PERMISSIONS.canCreateContent,
      canComment: GUEST_PERMISSIONS.canComment,
      canLike: GUEST_PERMISSIONS.canLike,
      canFavorite: GUEST_PERMISSIONS.canFavorite,
      previewPercentage: GUEST_PERMISSIONS.previewPercentage,
      canPlayVideo: GUEST_PERMISSIONS.canPlayVideo,
    })
    setMessage(null)
  }

  const statusOptions = [
    { value: 'PUBLISHED', label: '已发布' },
    { value: 'DRAFT', label: '草稿' },
    { value: 'REVIEW', label: '待审核' },
    { value: 'REJECTED', label: '已拒绝' },
    { value: 'ARCHIVED', label: '已归档' },
  ]

  return (
    <AdminLayout title="游客权限设置 - 兔图管理后台">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">游客权限设置</h1>
          <p className="mt-1 text-sm text-gray-500">
            配置未登录用户（游客）的访问权限和功能限制
          </p>
        </div>

        {message && (
          <Alert
            variant={message.type === 'success' ? 'success' : 'error'}
            className="mb-6"
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <div className="space-y-6">
          {/* 基础权限 */}
          <Card>
            <CardHeader>
              <CardTitle>基础权限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Checkbox
                id="canView"
                label="允许查看内容"
                checked={settings.canView}
                onChange={(e) => setSettings({ ...settings, canView: e.target.checked })}
              />

              <Checkbox
                id="canSearch"
                label="允许搜索内容"
                checked={settings.canSearch}
                onChange={(e) => setSettings({ ...settings, canSearch: e.target.checked })}
              />

              <Checkbox
                id="canPlayVideo"
                label="允许播放视频"
                checked={settings.canPlayVideo}
                onChange={(e) => setSettings({ ...settings, canPlayVideo: e.target.checked })}
              />
            </CardContent>
          </Card>

          {/* 内容权限 */}
          <Card>
            <CardHeader>
              <CardTitle>内容权限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  可查看的内容状态
                </label>
                <div className="space-y-2">
                  {statusOptions.map((option) => (
                    <Checkbox
                      key={option.value}
                      id={`status-${option.value}`}
                      label={option.label}
                      checked={settings.allowedStatuses.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            allowedStatuses: [...settings.allowedStatuses, option.value]
                          })
                        } else {
                          setSettings({
                            ...settings,
                            allowedStatuses: settings.allowedStatuses.filter(s => s !== option.value)
                          })
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="previewPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  内容预览百分比 (%)
                </label>
                <Input
                  id="previewPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={settings.previewPercentage}
                  onChange={(e) => setSettings({ ...settings, previewPercentage: parseInt(e.target.value) || 0 })}
                  className="w-32"
                />
                <p className="mt-1 text-xs text-gray-500">
                  游客可以查看内容的百分比，0表示不能查看，100表示可以查看全部内容
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 互动权限 */}
          <Card>
            <CardHeader>
              <CardTitle>互动权限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Checkbox
                id="canCreateContent"
                label="允许创建内容"
                checked={settings.canCreateContent}
                onChange={(e) => setSettings({ ...settings, canCreateContent: e.target.checked })}
              />

              <Checkbox
                id="canComment"
                label="允许评论"
                checked={settings.canComment}
                onChange={(e) => setSettings({ ...settings, canComment: e.target.checked })}
              />

              <Checkbox
                id="canLike"
                label="允许点赞"
                checked={settings.canLike}
                onChange={(e) => setSettings({ ...settings, canLike: e.target.checked })}
              />

              <Checkbox
                id="canFavorite"
                label="允许收藏"
                checked={settings.canFavorite}
                onChange={(e) => setSettings({ ...settings, canFavorite: e.target.checked })}
              />
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              重置为默认
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/settings/guest-permissions',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
