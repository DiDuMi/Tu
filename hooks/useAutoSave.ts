import { useEffect, useRef, useState } from 'react'

interface AutoSaveData {
  title: string
  content: string
  excerpt: string
  categoryId: string
  selectedTagIds: number[]
  coverImage: string
}

interface UseAutoSaveOptions {
  delay?: number // 延迟时间（毫秒）
  enabled?: boolean // 是否启用自动保存
  onSave?: (data: AutoSaveData) => Promise<void> // 保存回调
}

export function useAutoSave(
  data: AutoSaveData,
  options: UseAutoSaveOptions = {}
) {
  const {
    delay = 3000, // 默认3秒延迟
    enabled = true,
    onSave
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const previousDataRef = useRef<AutoSaveData>()

  // 检查数据是否有变化
  const hasDataChanged = (current: AutoSaveData, previous?: AutoSaveData) => {
    if (!previous) return true
    
    return (
      current.title !== previous.title ||
      current.content !== previous.content ||
      current.excerpt !== previous.excerpt ||
      current.categoryId !== previous.categoryId ||
      current.coverImage !== previous.coverImage ||
      JSON.stringify(current.selectedTagIds) !== JSON.stringify(previous.selectedTagIds)
    )
  }

  // 执行保存
  const performSave = async () => {
    if (!onSave || !enabled) return

    try {
      setIsSaving(true)
      setSaveError(null)
      await onSave(data)
      setLastSaved(new Date())
      previousDataRef.current = { ...data }
    } catch (error) {
      console.error('Auto save failed:', error)
      setSaveError(error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  // 设置自动保存定时器
  useEffect(() => {
    if (!enabled || !hasDataChanged(data, previousDataRef.current)) {
      return
    }

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      performSave()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled])

  // 手动保存
  const saveNow = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    performSave()
  }

  // 格式化最后保存时间
  const getLastSavedText = () => {
    if (!lastSaved) return null
    
    const now = new Date()
    const diff = now.getTime() - lastSaved.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '刚刚保存'
    if (minutes < 60) return `${minutes}分钟前保存`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前保存`
    
    return lastSaved.toLocaleDateString()
  }

  return {
    isSaving,
    lastSaved,
    saveError,
    saveNow,
    getLastSavedText
  }
}
