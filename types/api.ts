/**
 * API成功响应类型
 */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

/**
 * API错误响应类型
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  message?: string
}

/**
 * API响应类型
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 分页数据类型
 */
export interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 分页响应类型
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationData
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * 用户API响应类型
 */
export interface UserResponse {
  id: string
  uuid: string
  name: string
  email: string
  role: string
  status: string
  image?: string | null
  createdAt: string
}

/**
 * 页面API响应类型
 */
export interface PageResponse {
  id: string
  uuid: string
  title: string
  content: string
  status: string
  featured: boolean
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
  }
  tags: string[]
}

/**
 * 媒体分类响应类型
 */
export interface MediaCategoryResponse {
  id: number
  uuid: string
  name: string
  slug: string
  description?: string
  parentId?: number
}

/**
 * 媒体标签响应类型
 */
export interface MediaTagResponse {
  id: number
  uuid: string
  name: string
  color?: string
  description?: string
}

/**
 * 媒体API响应类型
 */
export interface MediaResponse {
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
  category?: MediaCategoryResponse
  tags?: MediaTagResponse[]
  versions?: {
    id: number
    uuid: string
    url: string
    versionNumber: number
    fileSize?: number
    width?: number
    height?: number
    duration?: number
    thumbnailUrl?: string
    changeNote?: string
    createdAt: string
    user?: {
      id: number
      name: string
    }
  }[]
}

/**
 * 媒体上传响应类型
 */
export interface MediaUploadResponse {
  taskId?: string // 上传任务ID
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
  category?: {
    id: number
    uuid: string
    name: string
  }
  tags?: {
    id: number
    uuid: string
    name: string
    color?: string
  }[]
  user?: {
    id: number
    name: string
  }
  createdAt?: string
  updatedAt?: string
  // 去重相关信息
  isDuplicate?: boolean // 是否为重复文件
  spaceSaved?: number   // 节省的存储空间（字节）
}

/**
 * 媒体筛选参数
 */
export interface MediaFilterParams extends PaginationParams {
  type?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  startDate?: string
  endDate?: string
  categoryId?: number | string
  tagIds?: (number | string)[]
  userId?: number | string
  status?: string
}
