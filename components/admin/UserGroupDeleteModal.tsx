import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

interface UserGroup {
  name: string
  userCount?: number
}

interface UserGroupDeleteModalProps {
  isOpen: boolean
  group: UserGroup
  deleteLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function UserGroupDeleteModal({
  isOpen,
  group,
  deleteLoading,
  onClose,
  onConfirm
}: UserGroupDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="确认删除"
    >
      <ModalBody>
        <p>
          确定要删除用户组 <strong>{group.name}</strong> 吗？此操作不可撤销。
        </p>
        {group.userCount && group.userCount > 0 && (
          <p className="mt-2 text-error-500">
            该用户组下有 {group.userCount} 个用户，请先将这些用户移动到其他用户组。
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={onClose}
          disabled={deleteLoading}
        >
          取消
        </Button>
        <Button
          variant="error"
          onClick={onConfirm}
          isLoading={deleteLoading}
          disabled={!!(group.userCount && group.userCount > 0)}
        >
          确认删除
        </Button>
      </ModalFooter>
    </Modal>
  )
}
