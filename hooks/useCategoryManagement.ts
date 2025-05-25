import { useState, useEffect } from 'react'
import { useFetch } from '@/hooks/useFetch'
import { useContentStore } from '@/stores/contentStore'
import { buildCategoryTree } from '@/lib/content'
import { Category } from '@/stores/contentStore'

/**
 * 分类管理自定义Hook
 * 用于管理分类相关的状态和操作
 */
export function useCategoryManagement() {
  const [mounted, setMounted] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [categoryTree, setCategoryTree] = useState<any[]>([])
  
  // 从状态管理中获取分类列表状态
  const {
    categories,
    totalCategories,
    categoriesCurrentPage,
    categoriesPageSize,
    categoriesIsLoading,
    categoriesError,
    categoriesSearchTerm,
    setCategories,
    setTotalCategories,
    setCategoriesCurrentPage,
    setCategoriesPageSize,
    setCategoriesIsLoading,
    setCategoriesError,
    setCategoriesSearchTerm,
  } = useContentStore()
  
  // 获取分类列表
  const { data: categoriesData, mutate: refreshCategories } = useFetch<{ success: boolean, data: { items: Category[], pagination: any } }>(
    mounted ? `/api/v1/categories?page=${categoriesCurrentPage}&limit=${categoriesPageSize}&search=${categoriesSearchTerm}` : null,
    {
      onSuccess: (data) => {
        if (data?.success) {
          setCategories(data.data.items)
          setTotalCategories(data.data.pagination.total)
          
          // 构建分类树
          const tree = buildCategoryTree(data.data.items)
          setCategoryTree(tree)
        }
      },
      onError: (error) => {
        setCategoriesError(error.message)
      },
    }
  )
  
  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 处理搜索词变化
  const handleSearchChange = (value: string) => {
    setCategoriesSearchTerm(value)
  }
  
  // 打开创建模态框
  const handleOpenCreateModal = () => {
    setCreateModalOpen(true)
  }
  
  // 打开编辑模态框
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category)
    setEditModalOpen(true)
  }
  
  // 打开删除模态框
  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category)
    setDeleteModalOpen(true)
  }
  
  // 处理模态框关闭
  const handleModalClose = () => {
    setCreateModalOpen(false)
    setEditModalOpen(false)
    setDeleteModalOpen(false)
    setSelectedCategory(null)
  }
  
  // 处理操作成功
  const handleSuccess = () => {
    refreshCategories()
  }
  
  return {
    mounted,
    createModalOpen,
    editModalOpen,
    deleteModalOpen,
    selectedCategory,
    categoryTree,
    categories,
    totalCategories,
    categoriesIsLoading,
    categoriesError,
    categoriesSearchTerm,
    handleSearchChange,
    handleOpenCreateModal,
    handleEditCategory,
    handleDeleteCategory,
    handleModalClose,
    handleSuccess,
  }
}
