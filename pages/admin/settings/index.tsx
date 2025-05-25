import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { useState, useEffect } from 'react'

import AdminLayout from '@/components/layout/AdminLayout'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useSystemStore, SystemSettingGroup } from '@/stores/systemStore'

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<SystemSettingGroup>('GENERAL')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  // 从状态管理获取系统设置
  const {
    settings,
    isLoadingSettings,
    settingsError,
    fetchSettings,
    updateSetting
  } = useSystemStore()

  // 获取系统设置
  useEffect(() => {
    fetchSettings()
    setMounted(true)
  }, [fetchSettings])

  // 按分组过滤设置
  const filteredSettings = settings.filter(setting => setting.group === activeTab)

  // 开始编辑设置
  const handleEdit = (key: string, value: string) => {
    setEditingKey(key)
    setEditValue(value)
  }

  // 保存设置
  const handleSave = async (key: string) => {
    try {
      await updateSetting(key, editValue)
      setEditingKey(null)
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setEditingKey(null)
    setEditValue('')
  }

  // 格式化设置值显示
  const formatSettingValue = (type: string, value: string) => {
    if (type === 'BOOLEAN') {
      return value === 'true' ? '是' : '否'
    }

    if (type === 'JSON' || type === 'ARRAY') {
      try {
        const parsed = JSON.parse(value)
        return JSON.stringify(parsed, null, 2)
      } catch (e) {
        return value
      }
    }

    return value
  }

  // 渲染设置编辑控件
  const renderSettingEditor = (setting: any) => {
    switch (setting.type) {
      case 'BOOLEAN':
        return (
          <Select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          >
            <option value="true">是</option>
            <option value="false">否</option>
          </Select>
        )
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )
      case 'JSON':
      case 'ARRAY':
        return (
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={5}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )
      default:
        return (
          <Input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )
    }
  }

  if (!mounted) return null

  return (
    <AdminLayout title="系统设置 - 兔图管理后台">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理系统全局配置和参数
        </p>
      </div>

      {settingsError && (
        <Alert variant="destructive" className="mb-4">
          {settingsError}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>配置管理</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SystemSettingGroup)}>
            <TabsList className="mb-6">
              <TabsTrigger value="GENERAL">基本设置</TabsTrigger>
              <TabsTrigger value="SECURITY">安全设置</TabsTrigger>
              <TabsTrigger value="EMAIL">邮件设置</TabsTrigger>
              <TabsTrigger value="MEDIA">媒体设置</TabsTrigger>
              <TabsTrigger value="CONTENT">内容设置</TabsTrigger>
              <TabsTrigger value="USERS">用户设置</TabsTrigger>
            </TabsList>

            {isLoadingSettings ? (
              <div className="text-center py-8">
                <p>加载中...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">配置项</th>
                      <th className="px-6 py-3">值</th>
                      <th className="px-6 py-3">类型</th>
                      <th className="px-6 py-3">描述</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSettings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center">
                          没有找到配置项
                        </td>
                      </tr>
                    ) : (
                      filteredSettings.map((setting) => (
                        <tr key={setting.id} className="bg-white border-b">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {setting.key}
                          </td>
                          <td className="px-6 py-4">
                            {editingKey === setting.key ? (
                              renderSettingEditor(setting)
                            ) : (
                              <div className="max-w-xs overflow-hidden text-ellipsis">
                                {formatSettingValue(setting.type, setting.value)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">{setting.type}</td>
                          <td className="px-6 py-4">{setting.description || '-'}</td>
                          <td className="px-6 py-4">
                            {editingKey === setting.key ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(setting.key)}
                                >
                                  保存
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancel}
                                >
                                  取消
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(setting.key, setting.value)}
                              >
                                编辑
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问系统设置
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/settings',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
