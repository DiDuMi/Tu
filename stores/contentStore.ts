import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

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
  likeCount: number
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name: string
    image?: string | null
  } | null
  author?: {
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
interface ContentState {
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

// 创建内容管理状态
export const useContentStore = create<ContentState>()(
  devtools(
    persist(
      (set, get) => ({
        // 内容列表状态
        pages: [],
        totalPages: 0,
        currentPage: 1,
        pageSize: 10,
        isLoading: false,
        error: null,
        searchTerm: '',
        statusFilter: null,
        categoryFilter: null,
        tagFilter: null,
        dateStartFilter: null,
        dateEndFilter: null,
        sortField: 'createdAt',
        sortDirection: 'desc',

        // 分类列表状态
        categories: [],
        totalCategories: 0,
        categoriesCurrentPage: 1,
        categoriesPageSize: 10,
        categoriesIsLoading: false,
        categoriesError: null,
        categoriesSearchTerm: '',

        // 标签列表状态
        tags: [],
        totalTags: 0,
        tagsCurrentPage: 1,
        tagsPageSize: 10,
        tagsIsLoading: false,
        tagsError: null,
        tagsSearchTerm: '',

        // 当前选中的内容、分类和标签
        selectedPage: null,
        selectedCategory: null,
        selectedTag: null,

        // 内容编辑状态
        editingPage: null,
        editingContent: '',
        editingTitle: '',
        editingExcerpt: null,
        editingCategoryId: null,
        editingTags: [],
        editingStatus: 'DRAFT',
        editingFeatured: false,
        editingScheduledPublishAt: null,
        editingScheduledArchiveAt: null,
        editingChangeLog: null,

        // 内容版本状态
        pageVersions: [],
        totalVersions: 0,
        versionsCurrentPage: 1,
        versionsPageSize: 10,
        versionsIsLoading: false,

        // 审核反馈状态
        reviewFeedbacks: [],
        totalFeedbacks: 0,
        feedbacksCurrentPage: 1,
        feedbacksPageSize: 10,
        feedbacksIsLoading: false,

        // 内容列表操作
        setPages: (pages) => set({ pages }),
        setTotalPages: (totalPages) => set({ totalPages }),
        setCurrentPage: (currentPage) => set({ currentPage }),
        setPageSize: (pageSize) => set({ pageSize }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setSearchTerm: (searchTerm) => set({ searchTerm }),
        setStatusFilter: (statusFilter) => set({ statusFilter }),
        setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
        setTagFilter: (tagFilter) => set({ tagFilter }),
        setDateFilter: (start, end) => set({
          dateStartFilter: start,
          dateEndFilter: end
        }),
        setSortField: (sortField) => set({ sortField }),
        setSortDirection: (sortDirection) => set({ sortDirection }),

        // 分类列表操作
        setCategories: (categories) => set({ categories }),
        setTotalCategories: (totalCategories) => set({ totalCategories }),
        setCategoriesCurrentPage: (categoriesCurrentPage) => set({ categoriesCurrentPage }),
        setCategoriesPageSize: (categoriesPageSize) => set({ categoriesPageSize }),
        setCategoriesIsLoading: (categoriesIsLoading) => set({ categoriesIsLoading }),
        setCategoriesError: (categoriesError) => set({ categoriesError }),
        setCategoriesSearchTerm: (categoriesSearchTerm) => set({ categoriesSearchTerm }),

        // 标签列表操作
        setTags: (tags) => set({ tags }),
        setTotalTags: (totalTags) => set({ totalTags }),
        setTagsCurrentPage: (tagsCurrentPage) => set({ tagsCurrentPage }),
        setTagsPageSize: (tagsPageSize) => set({ tagsPageSize }),
        setTagsIsLoading: (tagsIsLoading) => set({ tagsIsLoading }),
        setTagsError: (tagsError) => set({ tagsError }),
        setTagsSearchTerm: (tagsSearchTerm) => set({ tagsSearchTerm }),

        // 选中操作
        setSelectedPage: (selectedPage) => set({ selectedPage }),
        setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
        setSelectedTag: (selectedTag) => set({ selectedTag }),

        // 内容编辑操作
        setEditingPage: (editingPage) => set({ editingPage }),
        setEditingContent: (editingContent) => set({ editingContent }),
        setEditingTitle: (editingTitle) => set({ editingTitle }),
        setEditingExcerpt: (editingExcerpt) => set({ editingExcerpt }),
        setEditingCategoryId: (editingCategoryId) => set({ editingCategoryId }),
        setEditingTags: (editingTags) => set({ editingTags }),
        setEditingStatus: (editingStatus) => set({ editingStatus }),
        setEditingFeatured: (editingFeatured) => set({ editingFeatured }),
        setEditingScheduledPublishAt: (editingScheduledPublishAt) => set({ editingScheduledPublishAt }),
        setEditingScheduledArchiveAt: (editingScheduledArchiveAt) => set({ editingScheduledArchiveAt }),
        setEditingChangeLog: (editingChangeLog) => set({ editingChangeLog }),

        // 初始化编辑状态
        initializeEditingPage: (page) => {
          if (page) {
            set({
              editingPage: page,
              editingContent: page.content,
              editingTitle: page.title,
              editingExcerpt: page.excerpt,
              editingCategoryId: page.category?.id || null,
              editingTags: page.tags?.map(tag => tag.id) || [],
              editingStatus: page.status,
              editingFeatured: page.featured,
              editingScheduledPublishAt: page.scheduledPublishAt,
              editingScheduledArchiveAt: page.scheduledArchiveAt,
              editingChangeLog: null,
            })
          } else {
            set({
              editingPage: null,
              editingContent: '',
              editingTitle: '',
              editingExcerpt: null,
              editingCategoryId: null,
              editingTags: [],
              editingStatus: 'DRAFT',
              editingFeatured: false,
              editingScheduledPublishAt: null,
              editingScheduledArchiveAt: null,
              editingChangeLog: null,
            })
          }
        },

        // 内容版本操作
        setPageVersions: (pageVersions) => set({ pageVersions }),
        setTotalVersions: (totalVersions) => set({ totalVersions }),
        setVersionsCurrentPage: (versionsCurrentPage) => set({ versionsCurrentPage }),
        setVersionsPageSize: (versionsPageSize) => set({ versionsPageSize }),
        setVersionsIsLoading: (versionsIsLoading) => set({ versionsIsLoading }),

        // 审核反馈操作
        setReviewFeedbacks: (reviewFeedbacks) => set({ reviewFeedbacks }),
        setTotalFeedbacks: (totalFeedbacks) => set({ totalFeedbacks }),
        setFeedbacksCurrentPage: (feedbacksCurrentPage) => set({ feedbacksCurrentPage }),
        setFeedbacksPageSize: (feedbacksPageSize) => set({ feedbacksPageSize }),
        setFeedbacksIsLoading: (feedbacksIsLoading) => set({ feedbacksIsLoading }),

        // 重置状态
        resetContentFilters: () => set({
          searchTerm: '',
          statusFilter: null,
          categoryFilter: null,
          tagFilter: null,
          dateStartFilter: null,
          dateEndFilter: null,
          currentPage: 1,
          sortField: 'createdAt',
          sortDirection: 'desc',
        }),

        resetCategoryFilters: () => set({
          categoriesSearchTerm: '',
          categoriesCurrentPage: 1,
        }),

        resetTagFilters: () => set({
          tagsSearchTerm: '',
          tagsCurrentPage: 1,
        }),

        resetEditingState: () => set({
          editingPage: null,
          editingContent: '',
          editingTitle: '',
          editingExcerpt: null,
          editingCategoryId: null,
          editingTags: [],
          editingStatus: 'DRAFT',
          editingFeatured: false,
          editingScheduledPublishAt: null,
          editingScheduledArchiveAt: null,
          editingChangeLog: null,
        }),

        resetAll: () => set({
          pages: [],
          totalPages: 0,
          currentPage: 1,
          pageSize: 10,
          isLoading: false,
          error: null,
          searchTerm: '',
          statusFilter: null,
          categoryFilter: null,
          tagFilter: null,
          dateStartFilter: null,
          dateEndFilter: null,
          sortField: 'createdAt',
          sortDirection: 'desc',
          categories: [],
          totalCategories: 0,
          categoriesCurrentPage: 1,
          categoriesPageSize: 10,
          categoriesIsLoading: false,
          categoriesError: null,
          categoriesSearchTerm: '',
          tags: [],
          totalTags: 0,
          tagsCurrentPage: 1,
          tagsPageSize: 10,
          tagsIsLoading: false,
          tagsError: null,
          tagsSearchTerm: '',
          selectedPage: null,
          selectedCategory: null,
          selectedTag: null,
          editingPage: null,
          editingContent: '',
          editingTitle: '',
          editingExcerpt: null,
          editingCategoryId: null,
          editingTags: [],
          editingStatus: 'DRAFT',
          editingFeatured: false,
          editingScheduledPublishAt: null,
          editingScheduledArchiveAt: null,
          editingChangeLog: null,
          pageVersions: [],
          totalVersions: 0,
          versionsCurrentPage: 1,
          versionsPageSize: 10,
          versionsIsLoading: false,
          reviewFeedbacks: [],
          totalFeedbacks: 0,
          feedbacksCurrentPage: 1,
          feedbacksPageSize: 10,
          feedbacksIsLoading: false,
        }),

        // URL参数同步
        syncWithUrl: (params) => {
          const page = params.get('page') ? parseInt(params.get('page')!) : 1
          const limit = params.get('limit') ? parseInt(params.get('limit')!) : 10
          const search = params.get('search') || ''
          const status = params.get('status') || null
          const category = params.get('category') ? parseInt(params.get('category')!) : null
          const tag = params.get('tag') ? parseInt(params.get('tag')!) : null
          const dateStart = params.get('dateStart') || null
          const dateEnd = params.get('dateEnd') || null
          const sortField = params.get('sortField') || 'createdAt'
          const sortDirection = (params.get('sortDirection') || 'desc') as 'asc' | 'desc'

          set({
            currentPage: page,
            pageSize: limit,
            searchTerm: search,
            statusFilter: status,
            categoryFilter: category,
            tagFilter: tag,
            dateStartFilter: dateStart,
            dateEndFilter: dateEnd,
            sortField,
            sortDirection,
          })
        },

        getQueryParams: () => {
          const state = get()
          const params: Record<string, string> = {
            page: state.currentPage.toString(),
            limit: state.pageSize.toString(),
          }

          if (state.searchTerm) params.search = state.searchTerm
          if (state.statusFilter) params.status = state.statusFilter
          if (state.categoryFilter) params.category = state.categoryFilter.toString()
          if (state.tagFilter) params.tag = state.tagFilter.toString()
          if (state.dateStartFilter) params.dateStart = state.dateStartFilter
          if (state.dateEndFilter) params.dateEnd = state.dateEndFilter
          if (state.sortField !== 'createdAt') params.sortField = state.sortField
          if (state.sortDirection !== 'desc') params.sortDirection = state.sortDirection

          return params
        },
      }),
      {
        name: 'content-store',
        partialize: (state) => ({
          pageSize: state.pageSize,
          categoriesPageSize: state.categoriesPageSize,
          tagsPageSize: state.tagsPageSize,
          versionsPageSize: state.versionsPageSize,
          feedbacksPageSize: state.feedbacksPageSize,
          sortField: state.sortField,
          sortDirection: state.sortDirection,
        }),
      }
    ),
    { name: 'content-store' }
  )
)
