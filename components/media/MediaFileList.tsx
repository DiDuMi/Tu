import React from 'react'

import { MediaUploadResponse } from '@/types/api'

import MediaFilePreview from './MediaFilePreview'

interface MediaFileListProps {
  files: File[]
  uploadedMedia: MediaUploadResponse[]
  fileErrors: Record<string, string>
}

export default function MediaFileList({ files, uploadedMedia, fileErrors }: MediaFileListProps) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">上传文件 ({files.length})</h3>
      <div className="space-y-2">
        {files.map((file, index) => (
          <MediaFilePreview
            key={`${file.name}-${index}`}
            file={file}
            uploadedMedia={uploadedMedia.find(m => m.title === file.name)}
            error={fileErrors?.[file.name]}
          />
        ))}
      </div>
    </div>
  )
}

export type { MediaFileListProps }
