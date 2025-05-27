import React from 'react'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

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

interface CategoryFormProps {
  formData: {
    name: string
    description: string
    slug: string
    parentId: string
  }
  formErrors: Record<string, string>
  categories?: MediaCategory[]
  currentCategory?: MediaCategory | null
  isEdit?: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onSubmit: () => void
  onCancel: () => void
}

export default function CategoryForm({
  formData,
  formErrors,
  categories = [],
  currentCategory,
  isEdit = false,
  onInputChange,
  onSubmit,
  onCancel
}: CategoryFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          分类名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          分类别名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="slug"
          value={formData.slug}
          onChange={onInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-500">用于URL，只能包含小写字母、数字和连字符</p>
        {formErrors.slug && <p className="mt-1 text-sm text-red-500">{formErrors.slug}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">描述</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          rows={3}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">父分类</label>
        <select
          name="parentId"
          value={formData.parentId}
          onChange={onInputChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="">无 (顶级分类)</option>
          {categories
            ?.filter(c => !isEdit || c.id !== currentCategory?.id)
            .map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </div>

      {formErrors.submit && (
        <Alert variant="error">{formErrors.submit}</Alert>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? '保存' : '创建'}
        </Button>
      </div>
    </div>
  )
}
