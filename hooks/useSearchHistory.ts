import { useState, useEffect } from 'react'

const SEARCH_HISTORY_KEY = 'search_history'
const MAX_HISTORY_ITEMS = 10

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // 从 localStorage 加载搜索历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const history = JSON.parse(stored)
        if (Array.isArray(history)) {
          setSearchHistory(history)
        }
      }
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  // 保存搜索历史到 localStorage
  const saveToStorage = (history: string[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }

  // 添加搜索记录
  const addToHistory = (query: string) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setSearchHistory(prev => {
      // 移除重复项
      const filtered = prev.filter(item => item !== trimmedQuery)
      // 添加到开头
      const newHistory = [trimmedQuery, ...filtered].slice(0, MAX_HISTORY_ITEMS)
      saveToStorage(newHistory)
      return newHistory
    })
  }

  // 从历史记录中移除
  const removeFromHistory = (query: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== query)
      saveToStorage(newHistory)
      return newHistory
    })
  }

  // 清除所有历史记录
  const clearHistory = () => {
    setSearchHistory([])
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }

  // 获取搜索建议（基于历史记录）
  const getSuggestions = (query: string, limit = 5) => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    return searchHistory
      .filter(item => item.toLowerCase().includes(lowerQuery))
      .slice(0, limit)
  }

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getSuggestions,
  }
}
