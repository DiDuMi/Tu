import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { getPlatformById } from '@/lib/download-platforms'

interface DownloadLink {
  id: number
  uuid: string
  platform: string
  pointCost: number
  title: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

interface PurchaseInfo {
  purchased: boolean
  url?: string
  extractCode?: string
  platform?: string
  title?: string
  pointCost?: number
  purchaseDate?: string
  accessCount?: number
  alreadyPurchased?: boolean
}

interface DownloadLinksSectionProps {
  pageId: string | number
  pageTitle: string
}

export default function DownloadLinksSection({ pageId, pageTitle }: DownloadLinksSectionProps) {
  const { data: session } = useSession()
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([])
  const [purchaseInfo, setPurchaseInfo] = useState<Record<number, PurchaseInfo>>({})
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<Record<number, boolean>>({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState<PurchaseInfo | null>(null)
  const [copyingStates, setCopyingStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchDownloadLinks()
  }, [pageId])

  // ESC键关闭模态框
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePurchaseModal()
      }
    }

    if (showSuccessModal) {
      document.addEventListener('keydown', handleEscape)
      // 防止页面滚动
      document.body.style.overflow = 'hidden'

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [showSuccessModal])

  const fetchDownloadLinks = async () => {
    try {
      const response = await fetch(`/api/v1/pages/${pageId}/download-links`)
      const data = await response.json()

      if (data.success) {
        const activeLinks = data.data ? data.data.filter((link: DownloadLink) => link.isActive) : []
        setDownloadLinks(activeLinks)

        // 如果用户已登录，检查购买状态
        if (session && activeLinks.length > 0) {
          checkPurchaseStatus(activeLinks)
        }
      }
    } catch (error) {
      console.error('获取下载链接失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPurchaseStatus = async (links: DownloadLink[]) => {
    const purchasePromises = links.map(async (link) => {
      try {
        const response = await fetch(`/api/v1/download-links/${link.id}/purchase`)
        const data = await response.json()
        return { linkId: link.id, data: data.success ? data.data : null }
      } catch (error) {
        console.error(`检查购买状态失败 (链接 ${link.id}):`, error)
        return { linkId: link.id, data: null }
      }
    })

    const results = await Promise.all(purchasePromises)
    const newPurchaseInfo: Record<number, PurchaseInfo> = {}

    results.forEach(({ linkId, data }) => {
      if (data) {
        newPurchaseInfo[linkId] = data
      }
    })

    setPurchaseInfo(newPurchaseInfo)
  }

  const handlePurchase = async (linkId: number) => {
    if (!session) {
      toast({
        title: '请先登录',
        description: '请先登录后再购买下载链接',
        variant: 'warning',
        duration: 3000
      })
      return
    }

    setPurchasing(prev => ({ ...prev, [linkId]: true }))

    try {
      const response = await fetch(`/api/v1/download-links/${linkId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        // 更新购买信息，确保包含 purchased: true
        setPurchaseInfo(prev => ({
          ...prev,
          [linkId]: {
            ...data.data,
            purchased: true
          }
        }))

        // 显示购买成功的详细信息
        showPurchaseSuccessModal(data.data)
      } else {
        toast({
          title: '兑换失败',
          description: data.error?.message || '兑换失败，请稍后重试',
          variant: 'destructive',
          duration: 4000
        })
      }
    } catch (error) {
      console.error('购买失败:', error)
      toast({
        title: '兑换失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
        duration: 4000
      })
    } finally {
      setPurchasing(prev => ({ ...prev, [linkId]: false }))
    }
  }

  const showPurchaseSuccessModal = (data: PurchaseInfo) => {
    console.log('显示购买成功模态框:', data)
    setSuccessData(data)
    setShowSuccessModal(true)
  }

  const closePurchaseModal = () => {
    console.log('关闭购买模态框')
    setShowSuccessModal(false)
    setSuccessData(null)
  }

  const copyToClipboard = async (text: string, type: string, key: string) => {
    try {
      setCopyingStates(prev => ({ ...prev, [key]: true }))
      await navigator.clipboard.writeText(text)

      // 显示成功提示
      toast({
        title: `${type}已复制到剪贴板`,
        variant: 'success',
        duration: 2000
      })

      // 2秒后重置状态
      setTimeout(() => {
        setCopyingStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (error) {
      console.error('复制失败:', error)
      setCopyingStates(prev => ({ ...prev, [key]: false }))
      toast({
        title: '复制失败',
        description: '请手动复制',
        variant: 'destructive',
        duration: 3000
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (downloadLinks.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
        <h3 className="text-lg font-semibold text-gray-900">资源下载</h3>
      </div>

      <div className="space-y-4">
        {downloadLinks.map((link) => {
          const platform = getPlatformById(link.platform)
          const purchase = purchaseInfo[link.id]
          const isPurchased = purchase?.purchased
          const isLoading = purchasing[link.id]

          return (
            <div key={link.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
              {/* 移动端垂直布局，桌面端水平布局 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${platform?.color || 'bg-gray-500'} flex items-center justify-center text-white text-sm sm:text-lg flex-shrink-0`}>
                    {platform?.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{link.title}</h4>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-xs sm:text-sm text-gray-500">
                      <span className="truncate">{platform?.name || '其他网盘'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">
                        {link.pointCost === 0
                          ? (platform?.id === 'telegram' ? '群组成员专享' : '免费下载')
                          : `${link.pointCost} 积分`
                        }
                      </span>
                    </div>
                    {link.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{link.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end sm:justify-start space-x-2 sm:space-x-3 flex-shrink-0">
                  {isPurchased ? (
                    <div className="w-full sm:w-auto sm:text-right">
                      <div className="text-xs sm:text-sm text-green-600 font-medium mb-1 sm:mb-2">已兑换</div>
                      <div className="flex flex-col sm:flex-col space-y-1 sm:space-y-2">
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(purchase.url!, '下载链接', `url-${link.id}`)}
                          className="w-full sm:w-auto sm:min-w-[100px]"
                          disabled={copyingStates[`url-${link.id}`]}
                        >
                          {copyingStates[`url-${link.id}`] ? '已复制!' : '复制链接'}
                        </Button>
                        {purchase.extractCode && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(purchase.extractCode!, '提取码', `code-${link.id}`)}
                            className="w-full sm:w-auto sm:min-w-[100px]"
                            disabled={copyingStates[`code-${link.id}`]}
                          >
                            {copyingStates[`code-${link.id}`] ? '已复制!' : '复制提取码'}
                          </Button>
                        )}
                      </div>
                      {purchase.purchaseDate && (
                        <div className="text-xs text-gray-500 mt-1 sm:mt-2 text-center sm:text-right">
                          购买时间: {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(link.id)}
                      disabled={isLoading || !session}
                      className="w-full sm:w-auto sm:min-w-[120px] text-xs sm:text-sm"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {link.pointCost === 0 ? '获取中...' : '兑换中...'}
                        </>
                      ) : (
                        <span className="truncate">
                          {link.pointCost === 0
                            ? (platform?.id === 'telegram' ? '获取群组链接' : '免费获取')
                            : `${link.pointCost} 积分兑换`
                          }
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {isPurchased && purchase.url && (
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs sm:text-sm">
                    <div className="font-medium text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">
                      {platform?.id === 'telegram' ? '群组信息：' : '下载信息：'}
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                        <span className="text-gray-600 flex-shrink-0 text-xs sm:text-sm">
                          {platform?.id === 'telegram' ? '群组链接:' : '下载链接:'}
                        </span>
                        <span className="font-mono text-xs bg-white px-2 py-1 rounded border break-all sm:max-w-xs sm:truncate">
                          {purchase.url}
                        </span>
                      </div>
                      {purchase.extractCode && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                          <span className="text-gray-600 flex-shrink-0 text-xs sm:text-sm">提取码:</span>
                          <span className="font-mono text-xs sm:text-sm bg-white px-2 py-1 rounded border">
                            {purchase.extractCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!session && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-700 text-sm">
              请先登录后兑换下载链接
            </span>
          </div>
        </div>
      )}

      {/* 购买成功模态框 */}
      {showSuccessModal && successData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={closePurchaseModal}
        >
          <div
            className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 右上角关闭按钮 */}
            <button
              onClick={closePurchaseModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {successData.pointCost === 0 ? '获取成功！' : '兑换成功！'}
              </h3>
              <p className="text-gray-600 text-sm">
                {successData.pointCost === 0
                  ? `已成功获取 ${successData.title}${successData.platform === 'telegram' ? '，请使用下方链接加入群组' : ''}`
                  : `已成功兑换 ${successData.title}，消耗 ${successData.pointCost} 积分`
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {successData.platform === 'telegram' ? '群组链接' : '下载链接'}
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      <input
                        type="text"
                        value={successData.url || ''}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white break-all"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(
                          successData.url!,
                          successData.platform === 'telegram' ? '群组链接' : '下载链接',
                          'modal-url'
                        )}
                        disabled={copyingStates['modal-url']}
                        className="w-full sm:w-auto sm:min-w-[60px]"
                      >
                        {copyingStates['modal-url'] ? '已复制!' : '复制'}
                      </Button>
                    </div>
                  </div>

                  {successData.extractCode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">提取码</label>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                          type="text"
                          value={successData.extractCode}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(successData.extractCode!, '提取码', 'modal-code')}
                          disabled={copyingStates['modal-code']}
                          className="w-full sm:w-auto sm:min-w-[60px]"
                        >
                          {copyingStates['modal-code'] ? '已复制!' : '复制'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 order-2 sm:order-1"
                  onClick={closePurchaseModal}
                >
                  关闭
                </Button>
                <Button
                  className="flex-1 order-1 sm:order-2"
                  onClick={() => {
                    if (successData.url) {
                      window.open(successData.url, '_blank')
                    }
                  }}
                >
                  {successData.platform === 'telegram' ? '打开群组' : '立即下载'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
