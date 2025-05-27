import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/date'

interface UserGroup {
  id: number
  uuid: string
  name: string
  description?: string | null
  userCount?: number
  previewPercentage: number
  createdAt: string
  updatedAt: string
  uploadLimits?: {
    maxFileSize?: number
    allowedTypes?: string[]
  } | null
}

interface UserGroupBasicInfoProps {
  group: UserGroup
}

export default function UserGroupBasicInfo({ group }: UserGroupBasicInfoProps) {
  return (
    <div className="space-y-6">
      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">用户组ID</dt>
              <dd className="text-sm text-gray-900">{group.id}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">UUID</dt>
              <dd className="text-sm text-gray-900 truncate max-w-[150px]" title={group.uuid}>
                {group.uuid}
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">名称</dt>
              <dd className="text-sm text-gray-900">{group.name}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">用户数量</dt>
              <dd className="text-sm text-gray-900">{group.userCount || 0}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">预览百分比</dt>
              <dd className="text-sm text-gray-900">{group.previewPercentage}%</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">创建时间</dt>
              <dd className="text-sm text-gray-900">{formatDate(group.createdAt)}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">更新时间</dt>
              <dd className="text-sm text-gray-900">{formatDate(group.updatedAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 描述卡片 */}
      {group.description && (
        <Card>
          <CardHeader>
            <CardTitle>描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{group.description}</p>
          </CardContent>
        </Card>
      )}

      {/* 上传限制卡片 */}
      {group.uploadLimits && (
        <Card>
          <CardHeader>
            <CardTitle>上传限制</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-200">
              {group.uploadLimits.maxFileSize && (
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">最大文件大小</dt>
                  <dd className="text-sm text-gray-900">
                    {Math.round(group.uploadLimits.maxFileSize / (1024 * 1024))} MB
                  </dd>
                </div>
              )}
              {group.uploadLimits.allowedTypes && group.uploadLimits.allowedTypes.length > 0 && (
                <div className="py-3">
                  <dt className="text-sm font-medium text-gray-500 mb-2">允许的文件类型</dt>
                  <dd className="text-sm text-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {group.uploadLimits.allowedTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
