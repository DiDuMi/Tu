import { useMemo } from 'react'

interface MediaCategory {
  id: number
  uuid: string
  name: string
  slug: string
  parentId: number | null
}

interface CategoryOption {
  value: string
  label: string
  children?: CategoryOption[]
}

export function useCategoryTree(categories: MediaCategory[] = []) {
  const categoryTree = useMemo(() => {
    const categoryMap: Record<number, MediaCategory & { children?: MediaCategory[] }> = {}
    const rootCategories: (MediaCategory & { children?: MediaCategory[] })[] = []

    // 首先创建一个以ID为键的映射
    categories.forEach(category => {
      categoryMap[category.id] = { ...category, children: [] }
    })

    // 然后构建树结构
    categories.forEach(category => {
      if (category.parentId === null) {
        rootCategories.push(categoryMap[category.id])
      } else if (categoryMap[category.parentId]) {
        categoryMap[category.parentId].children!.push(categoryMap[category.id])
      }
    })

    // 转换为下拉菜单选项格式
    const convertToOptions = (cats: (MediaCategory & { children?: MediaCategory[] })[], level = 0): CategoryOption[] => {
      return cats.map(cat => {
        const option: CategoryOption = {
          value: cat.id.toString(),
          label: '　'.repeat(level) + cat.name,
        }

        if (cat.children && cat.children.length > 0) {
          return {
            ...option,
            children: convertToOptions(cat.children, level + 1)
          }
        }

        return option
      })
    }

    return convertToOptions(rootCategories)
  }, [categories])

  return categoryTree
}

export type { MediaCategory, CategoryOption }
