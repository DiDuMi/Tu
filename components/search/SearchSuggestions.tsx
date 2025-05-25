import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { useSearchHistory } from '@/hooks/useSearchHistory'

interface SearchSuggestionsProps {
  query: string
  isVisible: boolean
  onSelect: (suggestion: string) => void
  onClose: () => void
  className?: string
}

interface Suggestion {
  id: string
  text: string
  type: 'history' | 'suggestion' | 'tag'
  count?: number
}

export function SearchSuggestions({
  query,
  isVisible,
  onSelect,
  onClose,
  className,
}: SearchSuggestionsProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const { searchHistory, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()
  const containerRef = useRef<HTMLDivElement>(null)

  // 模拟的热门标签和建议
  const popularTags = [
    { text: '最新', count: 1234 },
    { text: '推荐', count: 987 },
    { text: '热门', count: 756 },
    { text: '教程', count: 543 },
    { text: '技术', count: 432 },
    { text: '设计', count: 321 },
  ]

  const searchSuggestions = [
    'React 教程',
    'Vue.js 入门',
    'TypeScript 指南',
    'Next.js 开发',
    'Tailwind CSS',
    'JavaScript 技巧',
  ]

  useEffect(() => {
    if (!query.trim()) {
      // 显示搜索历史和热门标签
      const historySuggestions: Suggestion[] = searchHistory.slice(0, 5).map((item, index) => ({
        id: `history-${index}`,
        text: item,
        type: 'history',
      }))

      const tagSuggestions: Suggestion[] = popularTags.slice(0, 6).map((tag, index) => ({
        id: `tag-${index}`,
        text: tag.text,
        type: 'tag',
        count: tag.count,
      }))

      setSuggestions([...historySuggestions, ...tagSuggestions])
    } else {
      // 根据查询过滤建议
      const filteredHistory = searchHistory
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map((item, index) => ({
          id: `history-${index}`,
          text: item,
          type: 'history' as const,
        }))

      const filteredSuggestions = searchSuggestions
        .filter(item => item.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 4)
        .map((item, index) => ({
          id: `suggestion-${index}`,
          text: item,
          type: 'suggestion' as const,
        }))

      const filteredTags = popularTags
        .filter(tag => tag.text.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map((tag, index) => ({
          id: `tag-${index}`,
          text: tag.text,
          type: 'tag' as const,
          count: tag.count,
        }))

      setSuggestions([...filteredHistory, ...filteredSuggestions, ...filteredTags])
    }
    setSelectedIndex(-1)
  }, [query, searchHistory])

  const handleSelect = (suggestion: Suggestion) => {
    addToHistory(suggestion.text)
    onSelect(suggestion.text)
    onClose()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isVisible) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, suggestions])

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history':
        return (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'tag':
        return (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      default:
        return (
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
    }
  }

  if (!isVisible || suggestions.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-50 max-h-96 overflow-y-auto',
        className
      )}
    >
      {/* 搜索历史 */}
      {searchHistory.length > 0 && !query.trim() && (
        <div className="p-3 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-dark-muted">搜索历史</span>
            <button
              onClick={clearHistory}
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-dark-muted dark:hover:text-dark-text"
            >
              清除
            </button>
          </div>
        </div>
      )}

      {/* 建议列表 */}
      <div className="py-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion.id}
            onClick={() => handleSelect(suggestion)}
            className={cn(
              'w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-border transition-colors',
              selectedIndex === index && 'bg-gray-50 dark:bg-dark-border'
            )}
          >
            <div className="flex-shrink-0 mr-3">
              {getSuggestionIcon(suggestion.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-dark-text truncate">
                  {suggestion.text}
                </span>
                {suggestion.count && (
                  <span className="text-xs text-gray-500 dark:text-dark-muted ml-2">
                    {suggestion.count > 1000 ? `${Math.floor(suggestion.count / 1000)}k` : suggestion.count}
                  </span>
                )}
              </div>
              {suggestion.type === 'history' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromHistory(suggestion.text)
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:text-dark-muted dark:hover:text-dark-text"
                >
                  删除
                </button>
              )}
            </div>
            {suggestion.type === 'tag' && (
              <div className="flex-shrink-0 ml-2">
                <span className="text-xs text-primary-600 dark:text-dark-primary">#</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 热门标签 */}
      {!query.trim() && (
        <div className="p-3 border-t border-gray-100 dark:border-dark-border">
          <span className="text-xs font-medium text-gray-500 dark:text-dark-muted mb-2 block">热门标签</span>
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 4).map((tag, index) => (
              <button
                key={index}
                onClick={() => handleSelect({ id: `hot-${index}`, text: tag.text, type: 'tag', count: tag.count })}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-border/80 transition-colors"
              >
                #{tag.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
