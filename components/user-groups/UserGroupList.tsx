import { useState } from 'react'
import Link from 'next/link'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { formatDate } from '@/lib/date'
import { UserGroup } from '@/stores/adminUserStore'
import { useMutation } from '@/hooks/useFetch'

interface UserGroupListProps {
  userGroups: UserGroup[]
  isLoading: boolean
  error: string | null
  onDelete: () => void
}

export default function UserGroupList({ userGroups, isLoading, error, onDelete }: UserGroupListProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null)

  // 删除用户组的API调用
  const { delete: deleteUserGroup, loading: deleteLoading } = useMutation<{ id: number }>('/api/v1/user-groups')

  // 处理删除用户组
  const handleDeleteUserGroup = async () => {
    if (!groupToDelete) return

    try {
      const result = await deleteUserGroup(groupToDelete.id.toString())
      if (result.success) {
        // 关闭模态框
        setDeleteModalOpen(false)
        setGroupToDelete(null)

        // 通知父组件刷新数据
        onDelete()
      }
    } catch (error) {
      console.error('删除用户组失败:', error)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>名称</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>用户数量</TableHead>
            <TableHead>预览百分比</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-error-500">
                {error}
              </TableCell>
            </TableRow>
          ) : userGroups.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                没有找到符合条件的用户组
              </TableCell>
            </TableRow>
          ) : (
            userGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{group.name}</div>
                </TableCell>
                <TableCell>
                  <div className="truncate max-w-xs" title={group.description || ''}>
                    {group.description || '-'}
                  </div>
                </TableCell>
                <TableCell>{group.userCount || 0}</TableCell>
                <TableCell>{group.previewPercentage}%</TableCell>
                <TableCell>{formatDate(group.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/admin/user-groups/${group.id}`}>
                      <Button variant="outline" size="sm">
                        查看
                      </Button>
                    </Link>
                    <Link href={`/admin/user-groups/${group.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        编辑
                      </Button>
                    </Link>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => {
                        setGroupToDelete(group)
                        setDeleteModalOpen(true)
                      }}
                      disabled={!!(group.userCount && group.userCount > 0)}
                      title={group.userCount && group.userCount > 0 ? '该用户组下有用户，无法删除' : ''}
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

      {/* 删除确认模态框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
      >
        <ModalBody>
          <p>
            确定要删除用户组 <strong>{groupToDelete?.name}</strong> 吗？此操作不可撤销。
          </p>
          {groupToDelete?.userCount && groupToDelete.userCount > 0 && (
            <p className="mt-2 text-error-500">
              该用户组下有 {groupToDelete.userCount} 个用户，请先将这些用户移动到其他用户组。
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteLoading}
          >
            取消
          </Button>
          <Button
            variant="error"
            onClick={handleDeleteUserGroup}
            isLoading={deleteLoading}
            disabled={!!(groupToDelete?.userCount && groupToDelete.userCount > 0)}
          >
            确认删除
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
