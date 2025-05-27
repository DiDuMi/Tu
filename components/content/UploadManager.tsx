import React, { useState, useRef, useCallback } from 'react'
import EnhancedBatchUpload from './EnhancedBatchUpload'
import MinimizedUpload from './MinimizedUpload'

interface UploadManagerProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (mediaList: any[]) => void
  initialFiles?: File[]
  allowCancel?: boolean
  allowPause?: boolean
  maxConcurrent?: number
}

interface UploadStats {
  uploadCount: number
  completedCount: number
  failedCount: number
  isUploading: boolean
}

const UploadManager: React.FC<UploadManagerProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
  initialFiles,
  allowCancel = true,
  allowPause = false,
  maxConcurrent = 3
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [uploadStats, setUploadStats] = useState<UploadStats>({
    uploadCount: 0,
    completedCount: 0,
    failedCount: 0,
    isUploading: false
  })

  // 使用 ref 来保持上传组件的引用，避免重新挂载
  const uploadComponentRef = useRef<any>(null)

  // 状态同步回调
  const handleStatsUpdate = useCallback((stats: UploadStats) => {
    setUploadStats(stats)
  }, [])

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleRestore = () => {
    setIsMinimized(false)
  }

  const handleClose = () => {
    setIsMinimized(false)
    onClose()
  }

  const handleUploadComplete = (mediaList: any[]) => {
    setIsMinimized(false)
    onUploadComplete(mediaList)
  }

  // 如果组件关闭且未最小化，不渲染任何内容
  if (!isOpen && !isMinimized) {
    return null
  }

  return (
    <>
      {/* 主上传界面 - 始终挂载，通过样式控制显示/隐藏 */}
      <div style={{ display: (isOpen && !isMinimized) ? 'block' : 'none' }}>
        <EnhancedBatchUpload
          ref={uploadComponentRef}
          isOpen={true}
          onClose={handleClose}
          onUploadComplete={handleUploadComplete}
          onMinimize={handleMinimize}
          onStatsUpdate={handleStatsUpdate}
          initialFiles={initialFiles}
          allowCancel={allowCancel}
          allowPause={allowPause}
          maxConcurrent={maxConcurrent}
        />
      </div>

      {/* 最小化界面 */}
      {isMinimized && (
        <MinimizedUpload
          isVisible={true}
          uploadCount={uploadStats.uploadCount}
          completedCount={uploadStats.completedCount}
          failedCount={uploadStats.failedCount}
          isUploading={uploadStats.isUploading}
          onRestore={handleRestore}
          onClose={handleClose}
        />
      )}
    </>
  )
}

export default UploadManager
