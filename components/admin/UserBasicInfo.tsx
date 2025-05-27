import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/date'

interface User {
  id: number
  uuid: string
  name: string
  email: string
  image?: string | null
  role: string
  status: string
  createdAt: string
  userGroup?: {
    name: string
  } | null
  telegramUsername?: string
  telegramId?: string
}

interface UserBasicInfoProps {
  user: User
}

// 获取用户状态徽章
const getUserStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">活跃</Badge>
    case 'PENDING':
      return <Badge variant="warning">待审核</Badge>
    case 'REJECTED':
      return <Badge variant="error">已拒绝</Badge>
    case 'SUSPENDED':
      return <Badge variant="error">已禁用</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

// 获取用户角色徽章
const getUserRoleBadge = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return <Badge variant="error">管理员</Badge>
    case 'OPERATOR':
      return <Badge variant="warning">操作员</Badge>
    case 'ANNUAL_MEMBER':
      return <Badge variant="secondary">年度会员</Badge>
    case 'MEMBER':
      return <Badge variant="primary">会员</Badge>
    case 'REGISTERED':
      return <Badge variant="default">注册用户</Badge>
    case 'GUEST':
      return <Badge variant="outline">访客</Badge>
    default:
      return <Badge>{role}</Badge>
  }
}

export default function UserBasicInfo({ user }: UserBasicInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="h-24 w-24 rounded-full bg-gray-200 flex-shrink-0 mb-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-24 w-24 rounded-full"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-3xl">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="mt-2 flex space-x-2">
            {getUserRoleBadge(user.role)}
            {getUserStatusBadge(user.status)}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <dl className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">用户ID</dt>
              <dd className="text-sm text-gray-900">{user.id}</dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">UUID</dt>
              <dd className="text-sm text-gray-900 truncate max-w-[150px]" title={user.uuid}>
                {user.uuid}
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">用户组</dt>
              <dd className="text-sm text-gray-900">
                {user.userGroup?.name || '无'}
              </dd>
            </div>
            <div className="py-3 flex justify-between">
              <dt className="text-sm font-medium text-gray-500">注册时间</dt>
              <dd className="text-sm text-gray-900">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            {user.telegramUsername && (
              <div className="py-3 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Telegram 用户名</dt>
                <dd className="text-sm text-gray-900">
                  @{user.telegramUsername}
                </dd>
              </div>
            )}
            {user.telegramId && (
              <div className="py-3 flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Telegram ID</dt>
                <dd className="text-sm text-gray-900">
                  {user.telegramId}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
