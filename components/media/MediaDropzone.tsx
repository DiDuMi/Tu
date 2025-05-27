import React from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'

import { formatFileSize } from '@/lib/upload'

interface MediaDropzoneProps {
  onDrop: (acceptedFiles: File[]) => void
  accept: Record<string, string[]>
  maxSize: number
  maxFiles: number
  isUploading: boolean
  fileRejections: readonly FileRejection[]
}

export default function MediaDropzone({
  onDrop,
  accept,
  maxSize,
  maxFiles,
  isUploading,
  fileRejections
}: MediaDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: isUploading,
  })

  // 渲染文件拒绝信息
  const renderRejections = () => {
    if (fileRejections.length === 0) return null

    return (
      <div className="mt-2 text-red-500 text-sm">
        {fileRejections.map(({ file, errors }) => (
          <div key={file.name} className="mb-1">
            <strong>{file.name}</strong>:
            <ul className="list-disc pl-5">
              {errors.map(error => (
                <li key={error.code}>{error.message}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {isDragActive ? (
            <p className="text-blue-500">释放文件开始上传...</p>
          ) : isUploading ? (
            <p className="text-gray-500">正在上传...</p>
          ) : (
            <div>
              <p className="text-gray-700">点击或拖拽文件到此区域上传</p>
              <p className="text-sm text-gray-500 mt-1">
                支持的文件类型: 图片(JPG, PNG, GIF, WebP), 视频(MP4, WebM, OGG), 音频(MP3, WAV, OGG, M4A)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                最大文件大小: {formatFileSize(maxSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {renderRejections()}
    </>
  )
}

export type { MediaDropzoneProps }
