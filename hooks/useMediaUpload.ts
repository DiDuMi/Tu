import { useCallback } from 'react'

import { MediaUploadResponse } from '@/types/api'
import useMediaStore from '@/stores/mediaStore'

interface UploadMetadata {
  title?: string
  description?: string
  categoryId?: string
  selectedTags?: string[]
}

interface UseMediaUploadProps {
  showMetadataForm: boolean
  metadata: UploadMetadata
}

export function useMediaUpload({ showMetadataForm, metadata }: UseMediaUploadProps) {
  const { setUploadProgress } = useMediaStore()

  // 计算文件的唯一标识符，用于断点续传
  const getFileIdentifier = useCallback((file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`
  }, [])

  // 检查是否支持断点续传
  const supportsChunkedUploads = useCallback((file: File): boolean => {
    // 只对大于5MB的文件使用分块上传
    return file.size > 5 * 1024 * 1024
  }, [])

  // 分块上传逻辑
  const uploadFileInChunks = useCallback(async (file: File, fileId: string): Promise<MediaUploadResponse> => {
    const chunkSize = 1024 * 1024 // 1MB 块大小
    const totalChunks = Math.ceil(file.size / chunkSize)

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

    return new Promise<MediaUploadResponse>(async (resolve, reject) => {
      try {
        // 上传所有块
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          // 如果这个块已经上传过，跳过
          if (uploadedChunks.includes(chunkIndex)) {
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
            if (metadata.title) formData.append('title', metadata.title)
            if (metadata.description) formData.append('description', metadata.description)
            if (metadata.categoryId) formData.append('categoryId', metadata.categoryId)
            if (metadata.selectedTags?.length) {
              metadata.selectedTags.forEach(tagId => {
                formData.append('tags[]', tagId)
              })
            }
          }

          // 上传当前块
          const xhr = new XMLHttpRequest()

          // 设置上传进度监听
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
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
                    uploadedChunks.push(chunkIndex)
                    localStorage.setItem(`upload-progress-${fileId}`, JSON.stringify(uploadedChunks))

                    if (chunkIndex === totalChunks - 1 && data.data.complete) {
                      localStorage.removeItem(`upload-progress-${fileId}`)
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
            if (metadata.title) finalizeFormData.append('title', metadata.title)
            if (metadata.description) finalizeFormData.append('description', metadata.description)
            if (metadata.categoryId) finalizeFormData.append('categoryId', metadata.categoryId)
            if (metadata.selectedTags?.length) {
              metadata.selectedTags.forEach(tagId => {
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
                    localStorage.removeItem(`upload-progress-${fileId}`)
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
  }, [setUploadProgress, showMetadataForm, metadata])

  // 常规上传逻辑
  const uploadFileRegular = useCallback(async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    // 添加元数据
    if (showMetadataForm) {
      if (metadata.title) formData.append('title', metadata.title)
      if (metadata.description) formData.append('description', metadata.description)
      if (metadata.categoryId) formData.append('categoryId', metadata.categoryId)
      if (metadata.selectedTags?.length) {
        metadata.selectedTags.forEach(tagId => {
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

    return new Promise<MediaUploadResponse>((resolve, reject) => {
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
  }, [setUploadProgress, showMetadataForm, metadata])

  // 主上传函数
  const uploadFile = useCallback(async (file: File, retryCount = 0, maxRetries = 3): Promise<MediaUploadResponse> => {
    try {
      const useChunkedUpload = supportsChunkedUploads(file)
      const fileId = getFileIdentifier(file)

      if (useChunkedUpload) {
        return await uploadFileInChunks(file, fileId)
      } else {
        return await uploadFileRegular(file)
      }
    } catch (error) {
      console.error(`文件上传失败 (尝试 ${retryCount + 1}/${maxRetries + 1}):`, error)

      if (retryCount < maxRetries) {
        console.log(`正在重试上传文件: ${file.name}`)
        setUploadProgress(file.name, 0)
        const retryDelay = 1000 * Math.pow(2, retryCount)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return uploadFile(file, retryCount + 1, maxRetries)
      }

      throw error
    }
  }, [getFileIdentifier, supportsChunkedUploads, uploadFileInChunks, uploadFileRegular, setUploadProgress])

  return {
    uploadFile,
    getFileIdentifier,
    supportsChunkedUploads
  }
}

export type { UploadMetadata, UseMediaUploadProps }
