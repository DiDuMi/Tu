import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

interface User {
  name: string
  applicationReason?: string
}

interface UserActionModalsProps {
  user: User
  deleteModalOpen: boolean
  approveModalOpen: boolean
  rejectModalOpen: boolean
  deleteLoading: boolean
  approveLoading: boolean
  onDeleteModalClose: () => void
  onApproveModalClose: () => void
  onRejectModalClose: () => void
  onDeleteUser: () => void
  onApproveUser: (reason?: string) => void
  onRejectUser: (reason?: string) => void
}

export default function UserActionModals({
  user,
  deleteModalOpen,
  approveModalOpen,
  rejectModalOpen,
  deleteLoading,
  approveLoading,
  onDeleteModalClose,
  onApproveModalClose,
  onRejectModalClose,
  onDeleteUser,
  onApproveUser,
  onRejectUser
}: UserActionModalsProps) {
  const [approveReason, setApproveReason] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = () => {
    onApproveUser(approveReason || undefined)
    setApproveReason('')
  }

  const handleReject = () => {
    onRejectUser(rejectReason || undefined)
    setRejectReason('')
  }

  return (
    <>
      {/* 删除确认模态框 */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={onDeleteModalClose}
        title="确认删除"
      >
        <ModalBody>
          <p>
            确定要删除用户 <strong>{user.name}</strong> 吗？此操作不可撤销。
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onDeleteModalClose}
            disabled={deleteLoading}
          >
            取消
          </Button>
          <Button
            variant="error"
            onClick={onDeleteUser}
            isLoading={deleteLoading}
          >
            确认删除
          </Button>
        </ModalFooter>
      </Modal>

      {/* 批准申请模态框 */}
      <Modal
        isOpen={approveModalOpen}
        onClose={onApproveModalClose}
        title="批准用户申请"
      >
        <ModalBody>
          <div className="space-y-4">
            <p>
              确定要批准用户 <strong>{user.name}</strong> 的申请吗？
            </p>
            {user.applicationReason && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">申请原因：</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {user.applicationReason}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="approveReason" className="block text-sm font-medium text-gray-700 mb-1">
                批准备注（可选）
              </label>
              <textarea
                id="approveReason"
                rows={3}
                value={approveReason}
                onChange={(e) => setApproveReason(e.target.value)}
                placeholder="可以添加批准的备注信息..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                maxLength={500}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onApproveModalClose}
            disabled={approveLoading}
          >
            取消
          </Button>
          <Button
            variant="success"
            onClick={handleApprove}
            isLoading={approveLoading}
          >
            确认批准
          </Button>
        </ModalFooter>
      </Modal>

      {/* 拒绝申请模态框 */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={onRejectModalClose}
        title="拒绝用户申请"
      >
        <ModalBody>
          <div className="space-y-4">
            <p>
              确定要拒绝用户 <strong>{user.name}</strong> 的申请吗？
            </p>
            {user.applicationReason && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">申请原因：</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {user.applicationReason}
                </p>
              </div>
            )}
            <div>
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-1">
                拒绝原因（建议填写）
              </label>
              <textarea
                id="rejectReason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请说明拒绝的原因，这将有助于用户了解拒绝的原因..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                maxLength={500}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={onRejectModalClose}
            disabled={approveLoading}
          >
            取消
          </Button>
          <Button
            variant="error"
            onClick={handleReject}
            isLoading={approveLoading}
          >
            确认拒绝
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
