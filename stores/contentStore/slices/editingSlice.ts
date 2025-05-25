/**
 * 内容编辑状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState, Page } from '../types'

// 创建内容编辑状态切片
export const createEditingSlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'editingPage'
    | 'editingContent'
    | 'editingTitle'
    | 'editingExcerpt'
    | 'editingCategoryId'
    | 'editingTags'
    | 'editingStatus'
    | 'editingFeatured'
    | 'editingScheduledPublishAt'
    | 'editingScheduledArchiveAt'
    | 'editingChangeLog'
    | 'selectedPage'
    | 'setEditingPage'
    | 'setEditingContent'
    | 'setEditingTitle'
    | 'setEditingExcerpt'
    | 'setEditingCategoryId'
    | 'setEditingTags'
    | 'setEditingStatus'
    | 'setEditingFeatured'
    | 'setEditingScheduledPublishAt'
    | 'setEditingScheduledArchiveAt'
    | 'setEditingChangeLog'
    | 'initializeEditingPage'
    | 'setSelectedPage'
  >
> = (set) => ({
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
  selectedPage: null,
  
  // 内容编辑操作
  setEditingPage: (editingPage: Page | null) => set({ editingPage }),
  setEditingContent: (editingContent: string) => set({ editingContent }),
  setEditingTitle: (editingTitle: string) => set({ editingTitle }),
  setEditingExcerpt: (editingExcerpt: string | null) => set({ editingExcerpt }),
  setEditingCategoryId: (editingCategoryId: number | null) => set({ editingCategoryId }),
  setEditingTags: (editingTags: number[]) => set({ editingTags }),
  setEditingStatus: (editingStatus: string) => set({ editingStatus }),
  setEditingFeatured: (editingFeatured: boolean) => set({ editingFeatured }),
  setEditingScheduledPublishAt: (editingScheduledPublishAt: string | null) => set({ editingScheduledPublishAt }),
  setEditingScheduledArchiveAt: (editingScheduledArchiveAt: string | null) => set({ editingScheduledArchiveAt }),
  setEditingChangeLog: (editingChangeLog: string | null) => set({ editingChangeLog }),
  setSelectedPage: (selectedPage: Page | null) => set({ selectedPage }),
  
  // 初始化编辑状态
  initializeEditingPage: (page: Page | null) => {
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
})
