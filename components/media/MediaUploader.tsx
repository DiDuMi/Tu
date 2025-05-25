import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import useSWR from 'swr'

import { MediaUploadResponse } from '@/types/api'
import { formatFileSize } from '@/lib/upload'
import useMediaStore from '@/stores/mediaStore'
import { fetcher } from '@/lib/fetcher'

interface MediaCategory {
  id: number
  uuid: string
  name: string
  slug: string
  parentId: number | null
}

interface MediaTag {
  id: number
  uuid: string
  name: string
  color: string | null
}

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
  const { isUploading, setIsUploading, setUploadProgress, resetUploadProgress } = useMediaStore()

  // 媒体元数据
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 获取分类和标签数据
  const { data: categories } = useSWR<MediaCategory[]>(
    showMetadataForm ? '/api/v1/media/categories' : null,
    fetcher
  )
  const { data: tags } = useSWR<MediaTag[]>(
    showMetadataForm ? '/api/v1/media/tags' : null,
    fetcher
  )

  // 计算文件的唯一标识符，用于断点续传
  const getFileIdentifier = useCallback((file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`
  }, [])

  // 检查是否支持断点续传
  const supportsChunkedUploads = useCallback((file: File): boolean => {
    // 只对大于5MB的文件使用分块上传
    return file.size > 5 * 1024 * 1024
  }, [])

  // 处理文件上传
  const uploadFile = useCallback(async (file: File, retryCount = 0, maxRetries = 3) => {
    try {
      // 检查是否支持断点续传
      const useChunkedUpload = supportsChunkedUploads(file)
      const fileId = getFileIdentifier(file)

      // 尝试从localStorage获取已上传的进度
      let uploadedChunks: number[] = []
      try {
        const savedProgress = localStorage.getItem(`upload-progress-${fileId}`)
        if (savedProgress) {
          uploadedChunks = JSON.parse(savedProgress)
        }
      } catch (e) {
        console.warn('无法读取上传进度:', e)
      }

      if (useChunkedUpload) {
        // 分块上传
        const chunkSize = 1024 * 1024 // 1MB 块大小
        const totalChunks = Math.ceil(file.size / chunkSize)

        // 创建一个Promise来跟踪总体上传进度
        return new Promise<MediaUploadResponse>(async (resolve, reject) => {
          try {
            // 上传所有块
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
              // 如果这个块已经上传过，跳过
              if (uploadedChunks.includes(chunkIndex)) {
                // 更新进度
                const progress = Math.round((uploadedChunks.length * 100) / totalChunks)
                setUploadProgress(file.name, progress)
                continue
              }

              // 计算当前块的范围
              const start = chunkIndex * chunkSize
              const end = Math.min(file.size, start + chunkSize)
              const chunk = file.slice(start, end)

              // 创建FormData
              const formData = new FormData()
              formData.append('file', chunk, file.name)
              formData.append('chunkIndex', chunkIndex.toString())
              formData.append('totalChunks', totalChunks.toString())
              formData.append('fileId', fileId)

              // 添加元数据（仅在最后一个块）
              if (chunkIndex === totalChunks - 1 && showMetadataForm) {
                if (title) formData.append('title', title)
                if (description) formData.append('description', description)
                if (categoryId) formData.append('categoryId', categoryId)
                if (selectedTags.length > 0) {
                  selectedTags.forEach(tagId => {
                    formData.append('tags[]', tagId)
                  })
                }
              }

              // 上传当前块
              const xhr = new XMLHttpRequest()

              // 设置上传进度监听
              xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                  // 计算总体进度
                  const chunkProgress = event.loaded / event.total
                  const overallProgress = ((chunkIndex + chunkProgress) / totalChunks) * 100
                  setUploadProgress(file.name, Math.round(overallProgress))
                }
              })

              // 上传块
              await new Promise<void>((chunkResolve, chunkReject) => {
                xhr.open('POST', '/api/v1/media/upload-chunk')

                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                      const data = JSON.parse(xhr.responseText)
                      if (data.success) {
                        // 记录已上传的块
                        uploadedChunks.push(chunkIndex)
                        localStorage.setItem(`upload-progress-${fileId}`, JSON.stringify(uploadedChunks))

                        // 如果是最后一个块，并且服务器已经合并了所有块
                        if (chunkIndex === totalChunks - 1 && data.data.complete) {
                          // 清除进度记录
                          localStorage.removeItem(`upload-progress-${fileId}`)
                          // 返回完整的媒体信息
                          resolve(data.data.media)
                        }

                        chunkResolve()
                      } else {
                        chunkReject(new Error(data.error?.message || '上传块失败'))
                      }
                    } catch (error) {
                      chunkReject(new Error('解析响应失败'))
                    }
                  } else {
                    chunkReject(new Error(`上传块失败: ${xhr.status}`))
                  }
                }

                xhr.onerror = () => chunkReject(new Error('网络错误'))
                xhr.onabort = () => chunkReject(new Error('上传已取消'))

                xhr.send(formData)
              })
            }

            // 如果所有块都已上传，但没有收到完整的媒体信息，请求合并
            if (uploadedChunks.length === totalChunks) {
              const finalizeFormData = new FormData()
              finalizeFormData.append('fileId', fileId)
              finalizeFormData.append('totalChunks', totalChunks.toString())
              finalizeFormData.append('fileName', file.name)

              // 添加元数据
              if (showMetadataForm) {
                if (title) finalizeFormData.append('title', title)
                if (description) finalizeFormData.append('description', description)
                if (categoryId) finalizeFormData.append('categoryId', categoryId)
                if (selectedTags.length > 0) {
                  selectedTags.forEach(tagId => {
                    finalizeFormData.append('tags[]', tagId)
                  })
                }
              }

              const finalizeXhr = new XMLHttpRequest()
              await new Promise<void>((finalizeResolve, finalizeReject) => {
                finalizeXhr.open('POST', '/api/v1/media/finalize-upload')

                finalizeXhr.onload = () => {
                  if (finalizeXhr.status >= 200 && finalizeXhr.status < 300) {
                    try {
                      const data = JSON.parse(finalizeXhr.responseText)
                      if (data.success) {
                        // 清除进度记录
                        localStorage.removeItem(`upload-progress-${fileId}`)
                        // 返回完整的媒体信息
                        resolve(data.data)
                        finalizeResolve()
                      } else {
                        finalizeReject(new Error(data.error?.message || '合并文件失败'))
                      }
                    } catch (error) {
                      finalizeReject(new Error('解析响应失败'))
                    }
                  } else {
                    finalizeReject(new Error(`合并文件失败: ${finalizeXhr.status}`))
                  }
                }

                finalizeXhr.onerror = () => finalizeReject(new Error('网络错误'))
                finalizeXhr.send(finalizeFormData)
              })
            }
          } catch (error) {
            reject(error)
          }
        })
      } else {
        // 常规上传（小文件）
        const formData = new FormData()
        formData.append('file', file)

        // 添加元数据
        if (showMetadataForm) {
          if (title) formData.append('title', title)
          if (description) formData.append('description', description)
          if (categoryId) formData.append('categoryId', categoryId)
          if (selectedTags.length > 0) {
            selectedTags.forEach(tagId => {
              formData.append('tags[]', tagId)
            })
          }
        }

        const xhr = new XMLHttpRequest()

        // 设置上传进度监听
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total)
            setUploadProgress(file.name, progress)
          }
        })

        // 创建Promise包装XHR请求
        const response = await new Promise<MediaUploadResponse>((resolve, reject) => {
          xhr.open('POST', '/api/v1/media/upload')

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText)
                if (data.success) {
                  resolve(data.data)
                } else {
                  reject(new Error(data.error?.message || '上传失败'))
                }
              } catch (error) {
                reject(new Error('解析响应失败'))
              }
            } else {
              reject(new Error(`上传失败: ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('网络错误'))
          xhr.onabort = () => reject(new Error('上传已取消'))

          xhr.send(formData)
        })

        return response
      }
    } catch (error) {
      console.error(`文件上传失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error)

      // 如果还有重试次数，则重试
      if (retryCount < maxRetries) {
        console.log(`正在重试上传文件: ${file.name}`)
        // 重置进度
        setUploadProgress(file.name, 0)
        // 延迟重试，每次重试增加延迟
        const retryDelay = 1000 * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return uploadFile(file, retryCount + 1, maxRetries)
      }

      throw error
    }
  }, [setUploadProgress, showMetadataForm, title, description, categoryId, selectedTags, getFileIdentifier, supportsChunkedUploads])

  // 处理文件拖放
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // 限制文件数量
    const filesToUpload = acceptedFiles.slice(0, maxFiles)
    setFiles(filesToUpload)

    try {
      setIsUploading(true)
      resetUploadProgress()

      // 重置错误状态
      setFileErrors({})

      // 上传所有文件，并跟踪每个文件的上传结果和错误
      const results: MediaUploadResponse[] = []
      const errors: Record<string, string> = {}

      // 逐个上传文件，而不是并行上传所有文件
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

      // 只有在所有文件都上传成功时才调用onSuccess
      if (results.length === filesToUpload.length) {
        onSuccess?.(results)
      }

      // 显示上传结果统计
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
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
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

  // 构建分类树
  const buildCategoryTree = (categories: MediaCategory[] = []): { value: string, label: string, children?: any[] }[] => {
    const categoryMap: Record<number, MediaCategory & { children?: MediaCategory[] }> = {}
    const rootCategories: (MediaCategory & { children?: MediaCategory[] })[] = []

    // 首先创建一个以ID为键的映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] }
    })

    // 然后构建树结构
    categories.forEach(category => {
      if (category.parentId === null) {
        rootCategories.push(categoryMap[category.id])
      } else if (categoryMap[category.parentId]) {
        categoryMap[category.parentId].children!.push(categoryMap[category.id])
      }
    })

    // 转换为下拉菜单选项格式
    const convertToOptions = (cats: (MediaCategory & { children?: MediaCategory[] })[], level = 0): any[] => {
      return cats.map(cat => {
        const option = {
          value: cat.id.toString(),
          label: '　'.repeat(level) + cat.name,
        }

        if (cat.children && cat.children.length > 0) {
          return {
            ...option,
            children: convertToOptions(cat.children, level + 1)
          }
        }

        return option
      })
    }

    return convertToOptions(rootCategories)
  }

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
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">媒体信息</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="media-title" className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                id="media-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="媒体标题（可选）"
              />
            </div>

            <div>
              <label htmlFor="media-description" className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                id="media-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="媒体描述（可选）"
              />
            </div>

            <div>
              <label htmlFor="media-category" className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                id="media-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- 选择分类（可选） --</option>
                {categories && buildCategoryTree(categories).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <div className="flex flex-wrap gap-2">
                {tags?.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagChange(tag.id.toString())}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${selectedTags.includes(tag.id.toString())
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                      } border`}
                  >
                    {tag.color && (
                      <span
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    {tag.name}
                  </button>
                ))}
                {!tags?.length && (
                  <span className="text-sm text-gray-500">暂无可用标签</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* 上传进度和预览 */}
      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">上传文件 ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                uploadedMedia={uploadedMedia.find(m => m.title === file.name)}
                error={fileErrors?.[file.name]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 文件预览组件
interface FilePreviewProps {
  file: File
  uploadedMedia?: MediaUploadResponse
  error?: string
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, uploadedMedia, error }) => {
  const { uploadProgress } = useMediaStore()
  const progress = uploadProgress[file.name] || 0

  // 创建文件预览URL
  const [previewUrl, setPreviewUrl] = useState<string>('')

  React.useEffect(() => {
    // 如果已上传成功，使用服务器返回的URL
    if (uploadedMedia?.url) {
      setPreviewUrl(uploadedMedia.url)
      return
    }

    // 否则创建本地预览
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, uploadedMedia])

  return (
    <div className="flex items-center p-2 bg-gray-50 rounded-lg">
      {/* 文件预览 */}
      <div className="w-12 h-12 mr-3 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
        {previewUrl && file.type.startsWith('image/') ? (
          <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>

        {/* 上传进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full ${uploadedMedia ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 上传状态 */}
      <div className="ml-3">
        {error ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title={error}>
            失败
          </span>
        ) : uploadedMedia ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            完成
          </span>
        ) : progress === 100 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            处理中
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {progress}%
          </span>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="w-full mt-1 text-xs text-red-600 truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  )
}

export default MediaUploader
