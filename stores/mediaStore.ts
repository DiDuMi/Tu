import { create } from 'zustand'
import { PaginatedResponse, PaginationParams } from '@/types/api'

// 媒体类型
export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'CLOUD_VIDEO' | 'ALL'

// 媒体排序方式
export type MediaSortBy = 'createdAt' | 'title' | 'fileSize' | 'type'

// 媒体排序顺序
export type SortOrder = 'asc' | 'desc'

// 媒体视图模式
export type ViewMode = 'grid' | 'list'

// 媒体项
export interface MediaItem {
  id: number
  uuid: string
  type: string
  url: string
  title?: string
  description?: string
  fileSize?: number
  mimeType?: string
  width?: number
  height?: number
  duration?: number
  thumbnailUrl?: string
  storageType?: string
  status?: string
  usageCount?: number
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name: string
  }
  category?: {
    id: number
    uuid: string
    name: string
    slug: string
  }
  tags?: {
    id: number
    uuid: string
    name: string
    color?: string
  }[]
}

// 媒体筛选参数
export interface MediaFilterParams extends PaginationParams {
  type?: MediaType
  search?: string
  sortBy?: MediaSortBy
  sortOrder?: SortOrder
  startDate?: string
  endDate?: string
  categoryId?: number | string
  tagIds?: (number | string)[]
  userId?: number | string
  status?: string
}

// 媒体状态
interface MediaState {
  // 媒体列表数据
  mediaItems: MediaItem[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }

  // 筛选和排序
  filter: MediaFilterParams
  viewMode: ViewMode

  // 选择状态
  selectedItems: string[] // 存储uuid

  // 加载状态
  isLoading: boolean
  error: string | null

  // 上传状态
  isUploading: boolean
  uploadProgress: Record<string, number> // 文件ID -> 进度百分比

  // 操作
  setFilter: (filter: Partial<MediaFilterParams>) => void
  setViewMode: (mode: ViewMode) => void
  setMediaItems: (data: PaginatedResponse<MediaItem>) => void
  selectItem: (uuid: string) => void
  unselectItem: (uuid: string) => void
  selectAll: () => void
  unselectAll: () => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setIsUploading: (isUploading: boolean) => void
  setUploadProgress: (fileId: string, progress: number) => void
  resetUploadProgress: () => void
  deleteMedia: (uuids: string[]) => Promise<boolean>
}

// 创建媒体状态管理
const useMediaStore = create<MediaState>((set, get) => ({
  // 初始状态
  mediaItems: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  },
  filter: {
    page: 1,
    limit: 20,
    type: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  viewMode: 'grid',
  selectedItems: [],
  isLoading: false,
  error: null,
  isUploading: false,
  uploadProgress: {},

  // 设置筛选参数
  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter }
    }))
  },

  // 设置视图模式
  setViewMode: (mode) => {
    set({ viewMode: mode })
  },

  // 设置媒体列表数据
  setMediaItems: (data) => {
    set({
      mediaItems: data.items,
      pagination: data.pagination,
      isLoading: false,
      error: null
    })
  },

  // 选择媒体项
  selectItem: (uuid) => {
    set((state) => ({
      selectedItems: [...state.selectedItems, uuid]
    }))
  },

  // 取消选择媒体项
  unselectItem: (uuid) => {
    set((state) => ({
      selectedItems: state.selectedItems.filter(id => id !== uuid)
    }))
  },

  // 选择所有媒体项
  selectAll: () => {
    const { mediaItems } = get()
    set({
      selectedItems: mediaItems.map(item => item.uuid)
    })
  },

  // 取消选择所有媒体项
  unselectAll: () => {
    set({ selectedItems: [] })
  },

  // 设置加载状态
  setIsLoading: (isLoading) => {
    set({ isLoading })
  },

  // 设置错误信息
  setError: (error) => {
    set({ error, isLoading: false })
  },

  // 设置上传状态
  setIsUploading: (isUploading) => {
    set({ isUploading })
  },

  // 设置上传进度
  setUploadProgress: (fileId, progress) => {
    set((state) => ({
      uploadProgress: {
        ...state.uploadProgress,
        [fileId]: progress
      }
    }))
  },

  // 重置上传进度
  resetUploadProgress: () => {
    set({ uploadProgress: {} })
  },

  // 删除媒体
  deleteMedia: async (uuids) => {
    try {
      // 对每个UUID发起删除请求
      const deletePromises = uuids.map(uuid =>
        fetch(`/api/v1/media/${uuid}`, {
          method: 'DELETE',
        }).then(res => {
          if (!res.ok) throw new Error('删除失败')
          return true
        })
      )

      // 等待所有删除请求完成
      await Promise.all(deletePromises)

      // 更新状态，移除已删除的媒体
      set((state) => ({
        mediaItems: state.mediaItems.filter(item => !uuids.includes(item.uuid)),
        selectedItems: state.selectedItems.filter(uuid => !uuids.includes(uuid))
      }))

      return true
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除媒体时发生错误' })
      return false
    }
  }
}))

export default useMediaStore
