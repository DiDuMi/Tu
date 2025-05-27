import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { DOWNLOAD_PLATFORMS, getPlatformById } from '@/lib/download-platforms'

interface DownloadLink {
  id?: number
  uuid?: string
  platform: string
  url: string
  extractCode?: string
  pointCost: number
  title: string
  description?: string
  sortOrder: number
}

interface LinkTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  pageId: string | number
  onLinksUpdated: () => void
}

export default function LinkTemplateModal({
  isOpen,
  onClose,
  pageId,
  onLinksUpdated
}: LinkTemplateModalProps) {
  const [links, setLinks] = useState<DownloadLink[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 初始化空链接
  const createEmptyLink = (): DownloadLink => ({
    platform: 'telegram',
    url: '',
    extractCode: '',
    pointCost: 0,
    title: '',
    description: '',
    sortOrder: 0
  })

  useEffect(() => {
    if (isOpen) {
      fetchLinks()
    }
  }, [isOpen, pageId])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/pages/${pageId}/download-links`)
      const data = await response.json()

      if (data.success) {
        setLinks(data.data.length > 0 ? data.data : [createEmptyLink()])
      }
    } catch (error) {
      console.error('获取下载链接失败:', error)
      setLinks([createEmptyLink()])
    } finally {
      setLoading(false)
    }
  }

  const addLink = () => {
    setLinks([...links, createEmptyLink()])
  }

  const removeLink = (index: number) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index))
    }
  }

  const updateLink = (index: number, field: keyof DownloadLink, value: any) => {
    const updatedLinks = [...links]
    updatedLinks[index] = { ...updatedLinks[index], [field]: value }
    setLinks(updatedLinks)
  }

  const saveLinks = async () => {
    setSaving(true)
    try {
      // 过滤掉空的链接
      const validLinks = links.filter(link =>
        link.title.trim() && link.url.trim()
      )

      console.log('保存链接数据:', validLinks)

      // 删除已移除的链接
      const existingLinkIds = links.filter(link => link.id).map(link => link.id)
      const validLinkIds = validLinks.filter(link => link.id).map(link => link.id)
      const linksToDelete = existingLinkIds.filter(id => !validLinkIds.includes(id))

      for (const linkId of linksToDelete) {
        console.log('删除链接:', linkId)
        const deleteResponse = await fetch(`/api/v1/download-links/${linkId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!deleteResponse.ok) {
          const errorData = await deleteResponse.json()
          console.error('删除链接失败:', errorData)
        }
      }

      // 保存或更新链接
      for (const link of validLinks) {
        console.log('处理链接:', link)

        if (link.id) {
          // 更新现有链接
          const updateResponse = await fetch(`/api/v1/download-links/${link.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: link.platform,
              url: link.url.trim(),
              extractCode: link.extractCode || undefined,
              pointCost: Number(link.pointCost) || 0,
              title: link.title.trim(),
              description: link.description?.trim() || undefined,
              sortOrder: Number(link.sortOrder) || 0
            })
          })

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json()
            console.error('更新链接失败:', errorData)
            throw new Error(`更新链接失败: ${errorData.error?.message || '未知错误'}`)
          }

          const updateResult = await updateResponse.json()
          console.log('更新链接成功:', updateResult)
        } else {
          // 创建新链接
          const createResponse = await fetch(`/api/v1/pages/${pageId}/download-links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              platform: link.platform,
              url: link.url.trim(),
              extractCode: link.extractCode || undefined,
              pointCost: Number(link.pointCost) || 0,
              title: link.title.trim(),
              description: link.description?.trim() || undefined,
              sortOrder: Number(link.sortOrder) || 0
            })
          })

          if (!createResponse.ok) {
            const errorData = await createResponse.json()
            console.error('创建链接失败:', errorData)
            throw new Error(`创建链接失败: ${errorData.error?.message || '未知错误'}`)
          }

          const createResult = await createResponse.json()
          console.log('创建链接成功:', createResult)
        }
      }

      console.log('所有链接保存成功')
      onLinksUpdated()
      onClose()
    } catch (error) {
      console.error('保存下载链接失败:', error)
      alert(`保存失败: ${error.message || '请稍后重试'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">链接模板管理</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : (
          <div className="space-y-6">
            {links.map((link, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">下载链接 {index + 1}</h3>
                  {links.length > 1 && (
                    <button
                      onClick={() => removeLink(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 网盘平台选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      网盘平台 *
                    </label>
                    <select
                      value={link.platform}
                      onChange={(e) => updateLink(index, 'platform', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DOWNLOAD_PLATFORMS.map(platform => (
                        <option key={platform.id} value={platform.id}>
                          {platform.icon} {platform.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 积分价格 */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      所需积分
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={link.pointCost || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || value === '0') {
                          updateLink(index, 'pointCost', 0)
                        } else {
                          const numValue = parseInt(value, 10)
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 10000) {
                            updateLink(index, 'pointCost', numValue)
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // 失去焦点时，如果为空则设置为0
                        if (e.target.value === '') {
                          updateLink(index, 'pointCost', 0)
                        }
                      }}
                      placeholder="0 (免费下载)"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      设置为0表示无需积分。Telegram群组：成员已付费进群，无需额外积分
                    </p>
                  </div>

                  {/* 链接标题 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      链接标题 *
                    </label>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => updateLink(index, 'title', e.target.value)}
                      placeholder="例如：高清原图包"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 下载链接 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      下载链接 *
                    </label>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 提取码 */}
                  {getPlatformById(link.platform)?.needsExtractCode && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        提取码
                      </label>
                      <input
                        type="text"
                        value={link.extractCode || ''}
                        onChange={(e) => updateLink(index, 'extractCode', e.target.value)}
                        placeholder="提取码"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* 描述 */}
                  <div className={getPlatformById(link.platform)?.needsExtractCode ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium mb-1">
                      描述
                    </label>
                    <input
                      type="text"
                      value={link.description || ''}
                      onChange={(e) => updateLink(index, 'description', e.target.value)}
                      placeholder="可选的描述信息"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center">
              <Button
                onClick={addLink}
                variant="outline"
                className="flex items-center gap-2"
              >
                <span>+</span>
                添加链接
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                >
                  取消
                </Button>
                <Button
                  onClick={saveLinks}
                  disabled={saving}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
