import React, { useState } from 'react'

import { PencilIcon, TrashIcon, ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface MediaCategory {
  id: number
  uuid: string
  name: string
  description: string | null
  slug: string
  parentId: number | null
  children?: MediaCategory[]
  createdAt: string
  updatedAt: string
}

interface CategoryTreeProps {
  categories: MediaCategory[]
  level?: number
  onEdit: (category: MediaCategory) => void
  onDelete: (category: MediaCategory) => void
}

export default function CategoryTree({
  categories,
  level = 0,
  onEdit,
  onDelete
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleExpand = (uuid: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [uuid]: !prev[uuid]
    }))
  }

  return (
    <ul className={`pl-${level > 0 ? 4 : 0}`}>
      {categories.map(category => (
        <li key={category.uuid} className="py-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center">
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleExpand(category.uuid)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {expandedCategories[category.uuid] ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="ml-6"></span>
              )}
              <span className="font-medium">{category.name}</span>
              {category.description && (
                <span className="ml-2 text-sm text-gray-500">({category.description})</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(category)}
                className="text-blue-600 hover:text-blue-800"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(category)}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {category.children && category.children.length > 0 && expandedCategories[category.uuid] && (
            <CategoryTree
              categories={category.children}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </li>
      ))}
    </ul>
  )
}
