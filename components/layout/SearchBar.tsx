import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import { SearchSuggestions } from '@/components/search/SearchSuggestions'

export default function SearchBar() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 热门标签
  const hotTags = ['最新', '推荐', '热门', '教程']

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (keyword.trim()) {
      // 移除可能存在的#符号
      const cleanKeyword = keyword.replace(/#/g, '').trim()

      // 检查是否匹配热门标签
      const isHotTag = hotTags.some(tag =>
        tag.toLowerCase() === cleanKeyword.toLowerCase()
      )

      if (isHotTag) {
        router.push({
          pathname: '/search',
          query: { tag: cleanKeyword },
        })
      } else {
        router.push({
          pathname: '/search',
          query: { q: cleanKeyword },
        })
      }
      setShowSuggestions(false)
      setIsExpanded(false)
    }
  }

  // 处理搜索图标点击
  const handleSearchIconClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
      // 使用setTimeout确保DOM更新后再聚焦
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else if (keyword.trim()) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  }

  // 处理失去焦点
  const handleBlur = (e: React.FocusEvent) => {
    // 检查点击是否在建议菜单内
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setTimeout(() => {
        setShowSuggestions(false)
        if (!keyword.trim()) {
          setIsExpanded(false)
        }
      }, 200)
    }
  }

  // 处理建议选择
  const handleSuggestionSelect = (suggestion: string) => {
    setKeyword(suggestion)
    router.push({
      pathname: '/search',
      query: { q: suggestion },
    })
    setShowSuggestions(false)
    setIsExpanded(false)
  }

  // 处理输入框聚焦
  const handleFocus = () => {
    setShowSuggestions(true)
  }

  // 点击外部关闭建议菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative flex items-center">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索内容或标签..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={`
              transition-all duration-300 ease-in-out
              border border-gray-300 rounded-full
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted
              dark:focus:ring-dark-primary
              ${isExpanded ? 'w-56 pl-4 pr-10 py-1.5 opacity-100' : 'w-0 p-0 opacity-0'}
            `}
          />
          <button
            type="button"
            onClick={handleSearchIconClick}
            className={`
              absolute right-2 top-1/2 transform -translate-y-1/2
              text-gray-500 hover:text-primary-600 focus:outline-none
              dark:text-dark-muted dark:hover:text-dark-primary
              ${isExpanded ? '' : 'relative right-0'}
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* 搜索建议 */}
          {isExpanded && (
            <SearchSuggestions
              query={keyword}
              isVisible={showSuggestions}
              onSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
              className="w-80"
            />
          )}
        </div>
      </form>
    </div>
  )
}
