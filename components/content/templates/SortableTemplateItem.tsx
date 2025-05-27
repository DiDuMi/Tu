import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import TemplateItemCard from './TemplateItemCard'
import { type ContentTemplate } from './TemplatePreviewModal'

interface SortableTemplateItemProps {
  template: ContentTemplate
  onEdit: (template: ContentTemplate) => void
  onDelete: () => void
  onSelect?: (template: ContentTemplate) => void
  compact?: boolean
}

export default function SortableTemplateItem({
  template,
  onEdit,
  onDelete,
  onSelect,
  compact = false
}: SortableTemplateItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  }

  return (
    <TemplateItemCard
      ref={setNodeRef}
      template={template}
      onEdit={onEdit}
      onDelete={onDelete}
      onSelect={onSelect}
      compact={compact}
      dragHandleProps={dragHandleProps}
      style={style}
      className={isDragging ? 'shadow-lg' : ''}
    />
  )
}

export type { SortableTemplateItemProps }
