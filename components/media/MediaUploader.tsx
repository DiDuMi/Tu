import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { MediaUploadResponse } from '@/types/api'
import useMediaStore from '@/stores/mediaStore'
import { useMediaUpload } from '@/hooks/useMediaUpload'

import MediaMetadataForm from './MediaMetadataForm'
import MediaDropzone from './MediaDropzone'
import MediaFileList from './MediaFileList'



interface MediaUploaderProps {
  onSuccess?: (media: MediaUploadResponse[]) => void
  maxFiles?: number
  accept?: Record<string, string[]>
  maxSize?: number
  className?: string
  showMetadataForm?: boolean
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onSuccess,
  maxFiles = 5,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.ogg'],
    'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className = '',
  showMetadataForm = true,
}) => {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse[]>([])
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({})
  const { isUploading, setIsUploading, resetUploadProgress } = useMediaStore()

  // 媒体元数据
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 使用上传Hook
  const { uploadFile } = useMediaUpload({
    showMetadataForm,
    metadata: { title, description, categoryId, selectedTags }
  })



  // 处理文件拖放
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filesToUpload = acceptedFiles.slice(0, maxFiles)
    setFiles(filesToUpload)

    try {
      setIsUploading(true)
      resetUploadProgress()
      setFileErrors({})

      const results: MediaUploadResponse[] = []
      const errors: Record<string, string> = {}

      for (const file of filesToUpload) {
        try {
          const result = await uploadFile(file)
          results.push(result)
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error)
          errors[file.name] = error instanceof Error ? error.message : '上传失败'
        }
      }

      setUploadedMedia(results)
      setFileErrors(errors)

      if (results.length === filesToUpload.length) {
        onSuccess?.(results)
      }

      if (results.length > 0) {
        console.log(`成功上传 ${results.length}/${filesToUpload.length} 个文件`)
      }

      if (Object.keys(errors).length > 0) {
        console.error(`${Object.keys(errors).length} 个文件上传失败`)
      }
    } catch (error) {
      console.error('上传过程中发生错误:', error)
    } finally {
      setIsUploading(false)
    }
  }, [maxFiles, onSuccess, resetUploadProgress, setIsUploading, uploadFile])

  // 配置文件拖放区域
  const { fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    disabled: isUploading,
  })

  // 处理标签变化
  const handleTagChange = (tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 元数据表单 */}
      {showMetadataForm && (
        <MediaMetadataForm
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          selectedTags={selectedTags}
          onTagChange={handleTagChange}
        />
      )}

      {/* 拖拽上传区域 */}
      <MediaDropzone
        onDrop={onDrop}
        accept={accept}
        maxSize={maxSize}
        maxFiles={maxFiles}
        isUploading={isUploading}
        fileRejections={fileRejections}
      />

      {/* 文件列表 */}
      <MediaFileList
        files={files}
        uploadedMedia={uploadedMedia}
        fileErrors={fileErrors}
      />
    </div>
  )
}



export default MediaUploader
