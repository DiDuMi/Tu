/**
 * 分类列表状态切片
 */

import { StateCreator } from 'zustand'
import { ContentState, Category } from '../types'

// 创建分类列表状态切片
export const createCategorySlice: StateCreator<
  ContentState,
  [],
  [],
  Pick<ContentState, 
    | 'categories' 
    | 'totalCategories' 
    | 'categoriesCurrentPage' 
    | 'categoriesPageSize' 
    | 'categoriesIsLoading' 
    | 'categoriesError' 
    | 'categoriesSearchTerm'
    | 'selectedCategory'
    | 'setCategories'
    | 'setTotalCategories'
    | 'setCategoriesCurrentPage'
    | 'setCategoriesPageSize'
    | 'setCategoriesIsLoading'
    | 'setCategoriesError'
    | 'setCategoriesSearchTerm'
    | 'setSelectedCategory'
  >
> = (set) => ({
  // 分类列表状态
  categories: [],
  totalCategories: 0,
  categoriesCurrentPage: 1,
  categoriesPageSize: 10,
  categoriesIsLoading: false,
  categoriesError: null,
  categoriesSearchTerm: '',
  selectedCategory: null,
  
  // 分类列表操作
  setCategories: (categories: Category[]) => set({ categories }),
  setTotalCategories: (totalCategories: number) => set({ totalCategories }),
  setCategoriesCurrentPage: (categoriesCurrentPage: number) => set({ categoriesCurrentPage }),
  setCategoriesPageSize: (categoriesPageSize: number) => set({ categoriesPageSize }),
  setCategoriesIsLoading: (categoriesIsLoading: boolean) => set({ categoriesIsLoading }),
  setCategoriesError: (categoriesError: string | null) => set({ categoriesError }),
  setCategoriesSearchTerm: (categoriesSearchTerm: string) => set({ categoriesSearchTerm }),
  setSelectedCategory: (selectedCategory: Category | null) => set({ selectedCategory }),
})
