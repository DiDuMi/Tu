import React from 'react'

import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

interface TagFormProps {
  formData: {
    name: string
    description: string
    color: string
  }
  formErrors: Record<string, string>
  isEdit?: boolean
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onColorChange: (color: string) => void
  onSubmit: () => void
  onCancel: () => void
}

// 预定义的颜色选项
const colorOptions = [
  { value: '#3B82F6', label: '蓝色' },
  { value: '#10B981', label: '绿色' },
  { value: '#F59E0B', label: '黄色' },
  { value: '#EF4444', label: '红色' },
  { value: '#8B5CF6', label: '紫色' },
  { value: '#EC4899', label: '粉色' },
  { value: '#6B7280', label: '灰色' },
  { value: '#000000', label: '黑色' }
]

export default function TagForm({
  formData,
  formErrors,
  isEdit = false,
  onInputChange,
  onColorChange,
  onSubmit,
  onCancel
}: TagFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          标签名称 <span className="text-red-500">*</span>
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
        <label className="mb-1 block text-sm font-medium">标签颜色</label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(color => (
            <button
              key={color.value}
              type="button"
              className={`h-8 w-8 rounded-full border-2 ${
                formData.color === color.value ? 'border-black' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => onColorChange(color.value)}
              title={color.label}
            />
          ))}
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={onInputChange}
            className="h-8 w-8 cursor-pointer rounded-full border-0"
            title="自定义颜色"
          />
        </div>
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
