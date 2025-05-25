/**
 * 内容列表状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState, Page } from '../types'

// 创建内容列表状态切片
export const createContentSlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'pages' 
    | 'totalPages' 
    | 'currentPage' 
    | 'pageSize' 
    | 'isLoading' 
    | 'error' 
    | 'searchTerm' 
    | 'statusFilter' 
    | 'categoryFilter' 
    | 'tagFilter' 
    | 'dateStartFilter' 
    | 'dateEndFilter' 
    | 'sortField' 
    | 'sortDirection'
    | 'setPages'
    | 'setTotalPages'
    | 'setCurrentPage'
    | 'setPageSize'
    | 'setIsLoading'
    | 'setError'
    | 'setSearchTerm'
    | 'setStatusFilter'
    | 'setCategoryFilter'
    | 'setTagFilter'
    | 'setDateFilter'
    | 'setSortField'
    | 'setSortDirection'
  >
> = (set) => ({
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
  
  // 内容列表操作
  setPages: (pages: Page[]) => set({ pages }),
  setTotalPages: (totalPages: number) => set({ totalPages }),
  setCurrentPage: (currentPage: number) => set({ currentPage }),
  setPageSize: (pageSize: number) => set({ pageSize }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  setSearchTerm: (searchTerm: string) => set({ searchTerm }),
  setStatusFilter: (statusFilter: string | null) => set({ statusFilter }),
  setCategoryFilter: (categoryFilter: number | null) => set({ categoryFilter }),
  setTagFilter: (tagFilter: number | null) => set({ tagFilter }),
  setDateFilter: (start: string | null, end: string | null) => set({ 
    dateStartFilter: start, 
    dateEndFilter: end 
  }),
  setSortField: (sortField: string) => set({ sortField }),
  setSortDirection: (sortDirection: 'asc' | 'desc') => set({ sortDirection }),
})
