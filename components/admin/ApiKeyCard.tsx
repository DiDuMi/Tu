import { formatDate } from '@/lib/utils'

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

interface ApiKeyCardProps {
  apiKey: ApiKey
  onDelete: (keyId: string) => void
}

export default function ApiKeyCard({ apiKey, onDelete }: ApiKeyCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                {apiKey.keyName}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                apiKey.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
              }`}>
                {apiKey.isActive ? '活跃' : '已禁用'}
              </span>
            </div>
            
            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-dark-muted">
              <p>所属用户: {apiKey.user?.name || apiKey.user?.email}</p>
              <p>权限: {JSON.parse(apiKey.permissions).join(', ')}</p>
              <p>使用次数: {apiKey.usageCount}</p>
              <p>创建时间: {formatDate(apiKey.createdAt)}</p>
              {apiKey.lastUsedAt && (
                <p>最后使用: {formatDate(apiKey.lastUsedAt)}</p>
              )}
              {apiKey.expiresAt && (
                <p>过期时间: {formatDate(apiKey.expiresAt)}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(apiKey.uuid)}
            >
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
