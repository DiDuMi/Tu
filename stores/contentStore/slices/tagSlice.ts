/**
 * 标签列表状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState, Tag } from '../types'

// 创建标签列表状态切片
export const createTagSlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'tags' 
    | 'totalTags' 
    | 'tagsCurrentPage' 
    | 'tagsPageSize' 
    | 'tagsIsLoading' 
    | 'tagsError' 
    | 'tagsSearchTerm'
    | 'selectedTag'
    | 'setTags'
    | 'setTotalTags'
    | 'setTagsCurrentPage'
    | 'setTagsPageSize'
    | 'setTagsIsLoading'
    | 'setTagsError'
    | 'setTagsSearchTerm'
    | 'setSelectedTag'
  >
> = (set) => ({
  // 标签列表状态
  tags: [],
  totalTags: 0,
  tagsCurrentPage: 1,
  tagsPageSize: 10,
  tagsIsLoading: false,
  tagsError: null,
  tagsSearchTerm: '',
  selectedTag: null,
  
  // 标签列表操作
  setTags: (tags: Tag[]) => set({ tags }),
  setTotalTags: (totalTags: number) => set({ totalTags }),
  setTagsCurrentPage: (tagsCurrentPage: number) => set({ tagsCurrentPage }),
  setTagsPageSize: (tagsPageSize: number) => set({ tagsPageSize }),
  setTagsIsLoading: (tagsIsLoading: boolean) => set({ tagsIsLoading }),
  setTagsError: (tagsError: string | null) => set({ tagsError }),
  setTagsSearchTerm: (tagsSearchTerm: string) => set({ tagsSearchTerm }),
  setSelectedTag: (selectedTag: Tag | null) => set({ selectedTag }),
})
