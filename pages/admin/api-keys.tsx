import { useState, useEffect } from 'react'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import useSWR from 'swr'

import { fetcher } from '@/lib/api'

import ApiKeyCard from '@/components/admin/ApiKeyCard'
import CreateApiKeyModal from '@/components/admin/CreateApiKeyModal'
import NewApiKeyDisplay from '@/components/admin/NewApiKeyDisplay'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface ApiKey {
  id: number
  uuid: string
  keyName: string
  permissions: string
  isActive: boolean
  expiresAt: string | null
  lastUsedAt: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

export default function AdminApiKeysPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyData, setNewKeyData] = useState<any>(null)

  // 获取所有API密钥列表（管理员权限）
  const { data: apiKeysData, error: _error, mutate } = useSWR(
    session ? '/api/v1/admin/api-keys' : null,
    fetcher
  )

  // 重定向未登录用户
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <AdminLayout title="API密钥管理">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  // 未登录用户显示提示（重定向在useEffect中处理）
  if (status === 'unauthenticated') {
    return (
      <AdminLayout title="API密钥管理">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">请先登录以访问管理后台</p>
            <Link href="/auth/signin">
              <Button>前往登录</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const apiKeys: ApiKey[] = apiKeysData?.data || []

  const handleCreateApiKey = async (formData: any) => {
    try {
      const response = await fetch('/api/v1/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setNewKeyData(result.data)
        setShowCreateForm(false)
        mutate()
      } else {
        alert(`创建失败: ${result.error?.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('创建API密钥失败:', error)
      alert('创建API密钥失败')
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('确定要删除这个API密钥吗？删除后无法恢复。')) {
      return
    }

    try {
      const response = await fetch('/api/v1/admin/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyId }),
      })

      const result = await response.json()

      if (result.success) {
        mutate()
      } else {
        alert(`删除失败: ${result.error?.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('删除API密钥失败:', error)
      alert('删除API密钥失败')
    }
  }

  return (
    <AdminLayout title="API密钥管理">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">API密钥管理</h1>
            <p className="mt-1 text-gray-600 dark:text-dark-muted">
              管理所有用户的API密钥，用于外部程序接入
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            创建API密钥
          </Button>
        </div>

        {/* 新创建的密钥显示 */}
        {newKeyData && (
          <NewApiKeyDisplay
            newKeyData={newKeyData}
            onClose={() => setNewKeyData(null)}
          />
        )}

        {/* API密钥列表 */}
        <div className="grid gap-4">
          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 dark:text-dark-muted">暂无API密钥</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  创建第一个API密钥
                </Button>
              </CardContent>
            </Card>
          ) : (
            apiKeys.map((apiKey) => (
              <ApiKeyCard
                key={apiKey.id}
                apiKey={apiKey}
                onDelete={handleDeleteApiKey}
              />
            ))
          )}
        </div>

        {/* 创建表单模态框 */}
        {showCreateForm && (
          <CreateApiKeyModal
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateApiKey}
          />
        )}
      </div>
    </AdminLayout>
  )
}
