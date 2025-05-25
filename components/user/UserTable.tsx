import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate } from '@/lib/date'
import { useAdminUserStore } from '@/stores/adminUserStore'
import { User } from '@/stores/adminUserStore'

interface UserTableProps {
  users: User[]
  isLoading: boolean
  error: string | null
  onDeleteClick: (user: User) => void
}

export default function UserTable({ users, isLoading, error, onDeleteClick }: UserTableProps) {
  const {
    selectedUserIds,
    isAllSelected,
    toggleSelectUser,
    toggleSelectAllUsers,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
  } = useAdminUserStore()

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

  // 处理排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // 渲染排序图标
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  // 渲染可排序的表头
  const renderSortableHeader = (field: string, label: string) => (
    <div
      className="flex items-center space-x-1 cursor-pointer"
      onClick={() => handleSort(field)}
    >
      <span>{label}</span>
      {renderSortIcon(field)}
    </div>
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={isAllSelected}
              onChange={toggleSelectAllUsers}
              disabled={!users || users.length === 0}
            />
          </TableHead>
          <TableHead>{renderSortableHeader('id', 'ID')}</TableHead>
          <TableHead>{renderSortableHeader('name', '用户名')}</TableHead>
          <TableHead>{renderSortableHeader('email', '邮箱')}</TableHead>
          <TableHead>{renderSortableHeader('role', '角色')}</TableHead>
          <TableHead>{renderSortableHeader('status', '状态')}</TableHead>
          <TableHead>用户组</TableHead>
          <TableHead>{renderSortableHeader('createdAt', '注册时间')}</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-error-500">
              {error}
            </TableCell>
          </TableRow>
        ) : users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
              没有找到符合条件的用户
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Checkbox
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleSelectUser(user.id)}
                />
              </TableCell>
              <TableCell>{user.id}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 mr-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {((user as any).telegramUsername || (user as any).telegramId) && (
                      <div className="text-xs text-gray-500">
                        {(user as any).telegramUsername && (
                          <span className="mr-2">@{(user as any).telegramUsername}</span>
                        )}
                        {(user as any).telegramId && (
                          <span className="text-blue-600">ID: {(user as any).telegramId}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getUserRoleBadge(user.role)}</TableCell>
              <TableCell>{getUserStatusBadge(user.status)}</TableCell>
              <TableCell>{user.userGroup?.name || '-'}</TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Link href={`/admin/users/${user.id}`}>
                    <Button variant="outline" size="sm">
                      查看
                    </Button>
                  </Link>
                  <Link href={`/admin/users/${user.id}/edit`}>
                    <Button variant="secondary" size="sm">
                      编辑
                    </Button>
                  </Link>
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => onDeleteClick(user)}
                  >
                    删除
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
