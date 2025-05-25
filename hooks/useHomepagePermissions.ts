import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getAvailableHomepageCategories, isHomepageCategory } from '@/lib/homepage-permissions'

interface Category {
  id: number
  name: string
  slug: string
}

interface UseHomepagePermissionsReturn {
  availableCategories: Category[]
  canPublishToCategory: (categorySlug: string) => boolean
  isHomepageCategory: (categorySlug: string) => boolean
  loading: boolean
}

/**
 * Hook for managing homepage category publishing permissions
 */
export function useHomepagePermissions(categories: Category[] = []): UseHomepagePermissionsReturn {
  const { data: session } = useSession()
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!categories.length) {
      setLoading(false)
      return
    }

    // Get available homepage category slugs for the current user
    const availableSlugs = getAvailableHomepageCategories(session)
    
    // Filter categories to only include those the user can publish to
    const filtered = categories.filter(category => {
      // Always allow non-homepage categories
      if (!isHomepageCategory(category.slug)) {
        return true
      }
      
      // For homepage categories, check permissions
      return availableSlugs.includes(category.slug)
    })

    setAvailableCategories(filtered)
    setLoading(false)
  }, [session, categories])

  const canPublishToCategory = (categorySlug: string): boolean => {
    // Always allow non-homepage categories
    if (!isHomepageCategory(categorySlug)) {
      return true
    }
    
    // For homepage categories, check permissions
    const availableSlugs = getAvailableHomepageCategories(session)
    return availableSlugs.includes(categorySlug)
  }

  return {
    availableCategories,
    canPublishToCategory,
    isHomepageCategory,
    loading
  }
}

/**
 * Hook for getting user's homepage category permissions
 */
export function useUserHomepagePermissions() {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const availableSlugs = getAvailableHomepageCategories(session)
    setPermissions(availableSlugs)
    setLoading(false)
  }, [session])

  return {
    permissions,
    loading,
    hasPermission: (categorySlug: string) => permissions.includes(categorySlug),
    isAdmin: session?.user?.role === 'ADMIN' || session?.user?.role === 'OPERATOR'
  }
}
