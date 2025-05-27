import { Button } from '@/components/ui/Button'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal'

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: string[]
}

interface UserImportProgressProps {
  isOpen: boolean
  progress: number
  result: ImportResult | null
  onClose: () => void
}

export default function UserImportProgress({
  isOpen,
  progress,
  result,
  onClose
}: UserImportProgressProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={result ? onClose : () => {}}
      title={result ? "导入结果" : "导入进度"}
      showCloseButton={!!result}
    >
      <ModalBody>
        {!result ? (
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-center">
              正在导入用户数据，请稍候...{Math.round(progress)}%
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">总计</p>
                <p className="text-xl font-semibold">{result.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">成功</p>
                <p className="text-xl font-semibold text-success-600">{result.success}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">失败</p>
                <p className="text-xl font-semibold text-error-600">{result.failed}</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="font-medium text-error-600 mb-2">错误信息：</p>
                <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg text-sm">
                  {result.errors.map((error, index) => (
                    <p key={index} className="mb-1">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalBody>
      {result && (
        <ModalFooter>
          <Button
            variant="primary"
            onClick={onClose}
          >
            关闭
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}
