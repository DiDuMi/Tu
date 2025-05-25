import React from 'react'
import TagBubble from './TagBubble'

interface Tag {
  name: string
  slug: string
  count?: number
}

interface TagListProps {
  tags: Tag[]
  className?: string
}

const TagList: React.FC<TagListProps> = ({ tags, className = '' }) => {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <TagBubble key={tag.slug} tag={tag} />
      ))}
    </div>
  )
}

export default TagList
