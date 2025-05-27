import React from 'react'

import { Button } from '@/components/ui/Button'

interface BatchUploadButtonProps {
  disabled?: boolean
  className?: string
}

const BatchUploadButton: React.FC<BatchUploadButtonProps> = ({
  disabled = false,
  className = ''
}) => {
  const handleClick = () => {
    // 触发 TinyMCE 编辑器的批量上传功能
    const event = new CustomEvent('openBatchUpload', {
      detail: { files: [] }
    })
    window.dispatchEvent(event)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${className}`}
      title="批量上传图片和视频"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
      批量上传
    </Button>
  )
}

export default BatchUploadButton
