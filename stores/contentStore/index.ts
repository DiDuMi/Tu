/**
 * 内容管理状态
 * 使用Zustand管理内容相关状态
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ContentState } from './types'
import { createContentSlice } from './slices/contentSlice'
import { createCategorySlice } from './slices/categorySlice'
import { createTagSlice } from './slices/tagSlice'
import { createEditingSlice } from './slices/editingSlice'
import { createVersionSlice } from './slices/versionSlice'
import { createReviewSlice } from './slices/reviewSlice'
import { createUtilsSlice } from './slices/utilsSlice'

// 创建内容管理状态
export const useContentStore = create<ContentState>()(
  devtools(
    persist(
      (set, get, store) => ({
        ...createContentSlice(set, get, store),
        ...createCategorySlice(set, get, store),
        ...createTagSlice(set, get, store),
        ...createEditingSlice(set, get, store),
        ...createVersionSlice(set, get, store),
        ...createReviewSlice(set, get, store),
        ...createUtilsSlice(set, get, store),
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

// 导出类型
export * from './types'
