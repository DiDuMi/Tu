/**
 * 内容版本状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState, PageVersion } from '../types'

// 创建内容版本状态切片
export const createVersionSlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'pageVersions'
    | 'totalVersions'
    | 'versionsCurrentPage'
    | 'versionsPageSize'
    | 'versionsIsLoading'
    | 'setPageVersions'
    | 'setTotalVersions'
    | 'setVersionsCurrentPage'
    | 'setVersionsPageSize'
    | 'setVersionsIsLoading'
  >
> = (set) => ({
  // 内容版本状态
  pageVersions: [],
  totalVersions: 0,
  versionsCurrentPage: 1,
  versionsPageSize: 10,
  versionsIsLoading: false,
  
  // 内容版本操作
  setPageVersions: (pageVersions: PageVersion[]) => set({ pageVersions }),
  setTotalVersions: (totalVersions: number) => set({ totalVersions }),
  setVersionsCurrentPage: (versionsCurrentPage: number) => set({ versionsCurrentPage }),
  setVersionsPageSize: (versionsPageSize: number) => set({ versionsPageSize }),
  setVersionsIsLoading: (versionsIsLoading: boolean) => set({ versionsIsLoading }),
})
