import Image from 'next/image'
import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'

interface User {
  id: number
  name: string
  email: string
  image?: string | null
  role: string
  status: string
}

interface UserGroupMembersProps {
  members: User[]
  membersLoading: boolean
  membersError: any
}

// 获取角色徽章变体
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'error'
    case 'OPERATOR':
      return 'warning'
    case 'ANNUAL_MEMBER':
      return 'secondary'
    case 'MEMBER':
      return 'primary'
    default:
      return 'default'
  }
}

// 获取状态徽章变体
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'PENDING':
      return 'warning'
    default:
      return 'error'
  }
}

export default function UserGroupMembers({
  members,
  membersLoading,
  membersError
}: UserGroupMembersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>用户组成员</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membersLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : membersError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-error-500">
                  {membersError instanceof Error ? membersError.message : membersError}
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  该用户组暂无成员
                </TableCell>
              </TableRow>
            ) : (
              members.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 mr-3 relative">
                        {user.image ? (
                          <Image
                            src={user.image}
                            alt={user.name}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span>{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm">
                        查看
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
