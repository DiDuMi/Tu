import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import SortableTemplateItem from './SortableTemplateItem'
import TemplateItemCard from './TemplateItemCard'
import { type ContentTemplate } from './TemplatePreviewModal'



interface SortableTemplateListProps {
  templates: ContentTemplate[]
  isLoading: boolean
  error: any
  onEdit: (template: ContentTemplate) => void
  onDelete: () => void
  onSelect?: (template: ContentTemplate) => void
  onReorder?: (templates: ContentTemplate[]) => void
  compact?: boolean
  enableSorting?: boolean
}

export default function SortableTemplateList({
  templates,
  isLoading,
  error,
  onEdit,
  onDelete,
  onSelect,
  onReorder,
  compact = false,
  enableSorting = true
}: SortableTemplateListProps) {
  const [items, setItems] = useState(templates)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 更新本地状态
  React.useEffect(() => {
    setItems(templates)
  }, [templates])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over?.id)

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)

      if (onReorder) {
        onReorder(newItems)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(compact ? 3 : 5)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-500">加载模板失败</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-gray-500">暂无模板</p>
      </div>
    )
  }

  const content = (
    <div className={`space-y-3 ${compact ? 'max-h-60 overflow-y-auto' : ''}`}>
      {items.map((template) => (
        enableSorting ? (
          <SortableTemplateItem
            key={template.id}
            template={template}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
            compact={compact}
          />
        ) : (
          <TemplateItemCard
            key={template.id}
            template={template}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
            compact={compact}
          />
        )
      ))}
    </div>
  )

  if (!enableSorting) {
    return content
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        {content}
      </SortableContext>
    </DndContext>
  )
}
