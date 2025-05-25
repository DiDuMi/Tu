/**
 * 内容管理状态类型定义
 */

// 内容类型定义
export interface Page {
  id: number
  uuid: string
  title: string
  content: string
  contentBlocks?: string | null
  excerpt?: string | null
  status: string
  featured: boolean
  publishedAt?: string | null
  scheduledPublishAt?: string | null
  scheduledArchiveAt?: string | null
  viewCount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name: string
    image?: string | null
  } | null
  category?: {
    id: number
    name: string
    slug: string
  } | null
  tags?: {
    id: number
    name: string
    slug: string
  }[]
  _count?: {
    comments: number
    likes: number
    versions: number
  }
}

// 分类类型定义
export interface Category {
  id: number
  uuid: string
  name: string
  slug: string
  description?: string | null
  parentId?: number | null
  parent?: Category | null
  children?: Category[]
  order: number
  createdAt: string
  updatedAt: string
  _count?: {
    pages: number
    children: number
  }
}

// 标签类型定义
export interface Tag {
  id: number
  uuid: string
  name: string
  slug: string
  description?: string | null
  useCount: number
  createdAt: string
  updatedAt: string
}

// 内容版本类型定义
export interface PageVersion {
  id: number
  uuid: string
  title: string
  content: string
  contentBlocks?: string | null
  versionNumber: number
  changeLog?: string | null
  createdAt: string
  user?: {
    id: number
    name: string
    image?: string | null
  } | null
}

// 审核反馈类型定义
export interface ReviewFeedback {
  id: number
  uuid: string
  content: string
  status: string
  createdAt: string
  reviewer?: {
    id: number
    name: string
    image?: string | null
  } | null
}

// 内容管理状态接口
export interface ContentState {
  // 内容列表状态
  pages: Page[]
  totalPages: number
  currentPage: number
  pageSize: number
  isLoading: boolean
  error: string | null
  searchTerm: string
  statusFilter: string | null
  categoryFilter: number | null
  tagFilter: number | null
  dateStartFilter: string | null
  dateEndFilter: string | null
  sortField: string
  sortDirection: 'asc' | 'desc'

  // 分类列表状态
  categories: Category[]
  totalCategories: number
  categoriesCurrentPage: number
  categoriesPageSize: number
  categoriesIsLoading: boolean
  categoriesError: string | null
  categoriesSearchTerm: string

  // 标签列表状态
  tags: Tag[]
  totalTags: number
  tagsCurrentPage: number
  tagsPageSize: number
  tagsIsLoading: boolean
  tagsError: string | null
  tagsSearchTerm: string

  // 当前选中的内容、分类和标签
  selectedPage: Page | null
  selectedCategory: Category | null
  selectedTag: Tag | null

  // 内容编辑状态
  editingPage: Page | null
  editingContent: string
  editingTitle: string
  editingExcerpt: string | null
  editingCategoryId: number | null
  editingTags: number[]
  editingStatus: string
  editingFeatured: boolean
  editingScheduledPublishAt: string | null
  editingScheduledArchiveAt: string | null
  editingChangeLog: string | null

  // 内容版本状态
  pageVersions: PageVersion[]
  totalVersions: number
  versionsCurrentPage: number
  versionsPageSize: number
  versionsIsLoading: boolean

  // 审核反馈状态
  reviewFeedbacks: ReviewFeedback[]
  totalFeedbacks: number
  feedbacksCurrentPage: number
  feedbacksPageSize: number
  feedbacksIsLoading: boolean

  // 内容列表操作
  setPages: (pages: Page[]) => void
  setTotalPages: (total: number) => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string | null) => void
  setCategoryFilter: (categoryId: number | null) => void
  setTagFilter: (tagId: number | null) => void
  setDateFilter: (start: string | null, end: string | null) => void
  setSortField: (field: string) => void
  setSortDirection: (direction: 'asc' | 'desc') => void

  // 分类列表操作
  setCategories: (categories: Category[]) => void
  setTotalCategories: (total: number) => void
  setCategoriesCurrentPage: (page: number) => void
  setCategoriesPageSize: (size: number) => void
  setCategoriesIsLoading: (isLoading: boolean) => void
  setCategoriesError: (error: string | null) => void
  setCategoriesSearchTerm: (term: string) => void

  // 标签列表操作
  setTags: (tags: Tag[]) => void
  setTotalTags: (total: number) => void
  setTagsCurrentPage: (page: number) => void
  setTagsPageSize: (size: number) => void
  setTagsIsLoading: (isLoading: boolean) => void
  setTagsError: (error: string | null) => void
  setTagsSearchTerm: (term: string) => void

  // 选中操作
  setSelectedPage: (page: Page | null) => void
  setSelectedCategory: (category: Category | null) => void
  setSelectedTag: (tag: Tag | null) => void

  // 内容编辑操作
  setEditingPage: (page: Page | null) => void
  setEditingContent: (content: string) => void
  setEditingTitle: (title: string) => void
  setEditingExcerpt: (excerpt: string | null) => void
  setEditingCategoryId: (categoryId: number | null) => void
  setEditingTags: (tagIds: number[]) => void
  setEditingStatus: (status: string) => void
  setEditingFeatured: (featured: boolean) => void
  setEditingScheduledPublishAt: (date: string | null) => void
  setEditingScheduledArchiveAt: (date: string | null) => void
  setEditingChangeLog: (changeLog: string | null) => void
  initializeEditingPage: (page: Page | null) => void

  // 内容版本操作
  setPageVersions: (versions: PageVersion[]) => void
  setTotalVersions: (total: number) => void
  setVersionsCurrentPage: (page: number) => void
  setVersionsPageSize: (size: number) => void
  setVersionsIsLoading: (isLoading: boolean) => void

  // 审核反馈操作
  setReviewFeedbacks: (feedbacks: ReviewFeedback[]) => void
  setTotalFeedbacks: (total: number) => void
  setFeedbacksCurrentPage: (page: number) => void
  setFeedbacksPageSize: (size: number) => void
  setFeedbacksIsLoading: (isLoading: boolean) => void

  // 重置状态
  resetContentFilters: () => void
  resetCategoryFilters: () => void
  resetTagFilters: () => void
  resetEditingState: () => void
  resetAll: () => void

  // URL参数同步
  syncWithUrl: (params: URLSearchParams) => void
  getQueryParams: () => Record<string, string>
}
