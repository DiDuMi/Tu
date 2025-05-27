import React from 'react'

import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

interface TemplateSettingsFieldsProps {
  sortOrder: number
  setSortOrder: (sortOrder: number) => void
  isPublic: boolean
  setIsPublic: (isPublic: boolean) => void
  isActive: boolean
  setIsActive: (isActive: boolean) => void
}

export default function TemplateSettingsFields({
  sortOrder,
  setSortOrder,
  isPublic,
  setIsPublic,
  isActive,
  setIsActive
}: TemplateSettingsFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="sortOrder">排序顺序</Label>
        <Input
          id="sortOrder"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <Label htmlFor="isPublic">公开模板</Label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <Label htmlFor="isActive">启用模板</Label>
      </div>
    </div>
  )
}

export type { TemplateSettingsFieldsProps }
