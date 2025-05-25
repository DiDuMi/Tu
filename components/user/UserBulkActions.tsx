import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useAdminUserStore } from '@/stores/adminUserStore'
import { useMutation } from '@/hooks/useFetch'
import { UserGroup } from '@/stores/adminUserStore'

interface UserBulkActionsProps {
  userGroups: UserGroup[]
  onActionComplete: () => void
}

export default function UserBulkActions({ userGroups, onActionComplete }: UserBulkActionsProps) {
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  
  const { selectedUserIds, unselectAllUsers } = useAdminUserStore()
  
  // API调用
  const { post: bulkUpdateStatus, loading: updateStatusLoading } = useMutation('/api/v1/users/bulk/status')
  const { post: bulkUpdateGroup, loading: updateGroupLoading } = useMutation('/api/v1/users/bulk/group')
  const { post: bulkDelete, loading: deleteLoading } = useMutation('/api/v1/users/bulk/delete')
  
  // 处理批量更新状态
  const handleBulkUpdateStatus = async () => {
    if (!selectedStatus || selectedUserIds.length === 0) return
    
    try {
      const result = await bulkUpdateStatus({
        userIds: selectedUserIds,
        status: selectedStatus
      })
      
      if (result.success) {
        setStatusModalOpen(false)
        setSelectedStatus('')
        unselectAllUsers()
        onActionComplete()
      }
    } catch (error) {
      console.error('批量更新状态失败:', error)
    }
  }
  
  // 处理批量更新用户组
  const handleBulkUpdateGroup = async () => {
    if (selectedUserIds.length === 0) return
    
    try {
      const result = await bulkUpdateGroup({
        userIds: selectedUserIds,
        userGroupId: selectedGroupId ? parseInt(selectedGroupId) : null
      })
      
      if (result.success) {
        setGroupModalOpen(false)
        setSelectedGroupId('')
        unselectAllUsers()
        onActionComplete()
      }
    } catch (error) {
      console.error('批量更新用户组失败:', error)
    }
  }
  
  // 处理批量删除
  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return
    
    try {
      const result = await bulkDelete({
        userIds: selectedUserIds
      })
      
      if (result.success) {
        setDeleteModalOpen(false)
        unselectAllUsers()
        onActionComplete()
      }
    } catch (error) {
      console.error('批量删除失败:', error)
    }
  }
  
  // 如果没有选中用户，不显示批量操作
  if (selectedUserIds.length === 0) {
    return null
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          已选择 <span className="font-medium">{selectedUserIds.length}</span> 个用户
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusModalOpen(true)}
          >
            批量修改状态
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGroupModalOpen(true)}
          >
            批量分配用户组
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
          >
            批量删除
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={unselectAllUsers}
          >
            取消选择
          </Button>
        </div>
      </div>
      
      {/* 批量修改状态模态框 */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="批量修改用户状态"
      >
        <ModalBody>
          <div className="space-y-4">
            <p>您将修改 {selectedUserIds.length} 个用户的状态。</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择新状态
              </label>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: '请选择状态' },
                  { value: 'ACTIVE', label: '活跃' },
                  { value: 'PENDING', label: '待审核' },
                  { value: 'SUSPENDED', label: '已禁用' },
                ]}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setStatusModalOpen(false)}
            disabled={updateStatusLoading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkUpdateStatus}
            isLoading={updateStatusLoading}
            disabled={!selectedStatus}
          >
            确认修改
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* 批量分配用户组模态框 */}
      <Modal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        title="批量分配用户组"
      >
        <ModalBody>
          <div className="space-y-4">
            <p>您将为 {selectedUserIds.length} 个用户分配用户组。</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择用户组
              </label>
              <Select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                options={[
                  { value: '', label: '无用户组' },
                  ...userGroups.map(group => ({
                    value: group.id.toString(),
                    label: group.name
                  }))
                ]}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setGroupModalOpen(false)}
            disabled={updateGroupLoading}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleBulkUpdateGroup}
            isLoading={updateGroupLoading}
          >
            确认分配
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* 批量删除模态框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="批量删除用户"
      >
        <ModalBody>
          <div className="space-y-4">
            <p className="text-error-600 font-medium">警告：此操作不可撤销！</p>
            <p>您确定要删除选中的 {selectedUserIds.length} 个用户吗？</p>
            <p className="text-sm text-gray-500">
              删除后，这些用户的所有数据将被标记为已删除，但仍会保留在数据库中。
            </p>
          </div>
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
            onClick={handleBulkDelete}
            isLoading={deleteLoading}
          >
            确认删除
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
