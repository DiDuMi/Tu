/**
 * 工具函数状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState } from '../types'

// 创建工具函数状态切片
export const createUtilsSlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'resetContentFilters'
    | 'resetCategoryFilters'
    | 'resetTagFilters'
    | 'resetEditingState'
    | 'resetAll'
    | 'syncWithUrl'
    | 'getQueryParams'
  >
> = (set, get) => ({
  // 重置内容筛选条件
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
  
  // 重置分类筛选条件
  resetCategoryFilters: () => set({
    categoriesSearchTerm: '',
    categoriesCurrentPage: 1,
  }),
  
  // 重置标签筛选条件
  resetTagFilters: () => set({
    tagsSearchTerm: '',
    tagsCurrentPage: 1,
  }),
  
  // 重置编辑状态
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
  
  // 重置所有状态
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
  syncWithUrl: (params: URLSearchParams) => {
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
  
  // 获取查询参数
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
})
