import React from 'react'

import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'

interface TemplateBasicFieldsProps {
  title: string
  setTitle: (title: string) => void
  type: 'HEADER' | 'FOOTER' | 'GENERAL'
  setType: (type: 'HEADER' | 'FOOTER' | 'GENERAL') => void
  description: string
  setDescription: (description: string) => void
  validationErrors: {[key: string]: string}
}

export default function TemplateBasicFields({
  title,
  setTitle,
  type,
  setType,
  description,
  setDescription,
  validationErrors
}: TemplateBasicFieldsProps) {
  return (
    <>
      {/* 基本信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入模板标题（可选）"
            className={validationErrors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          />
          {validationErrors.title && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">模板类型</Label>
          <Select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'HEADER' | 'FOOTER' | 'GENERAL')}
          >
            <option value="GENERAL">通用模板</option>
            <option value="HEADER">页头模板</option>
            <option value="FOOTER">页尾模板</option>
          </Select>
        </div>
      </div>

      {/* 描述 */}
      <div>
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入模板描述（可选）"
          rows={2}
        />
      </div>
    </>
  )
}

export type { TemplateBasicFieldsProps }
