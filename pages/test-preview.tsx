import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import ContentPreviewLimit from '@/components/content/ContentPreviewLimit'
import { processContentForPreview, getContentPreviewInfoWithVideo } from '@/lib/content'

// 测试内容
const TEST_CONTENT = `
<p>这是第一段内容。这里包含了一些基本的文本信息，用于测试预览功能的效果。</p>
<p>这是第二段内容。我们可以看到不同的预览百分比会如何影响内容的显示。</p>
<p>这是第三段内容。当预览百分比较低时，用户只能看到前面的部分内容。</p>
<p>这是第四段内容。这段内容包含了更多的详细信息和说明。</p>
<p>这是第五段内容。完整的内容只有在用户有足够权限时才能查看。</p>
<div>
  <h3>这是一个标题</h3>
  <p>标题下面的内容段落。</p>
</div>
<p>这是最后一段内容。如果您能看到这段文字，说明您有完整的访问权限。</p>
`

export default function TestPreviewPage() {
  const { data: session } = useSession()
  const [previewPercentage, setPreviewPercentage] = useState(30)
  const [processedContent, setProcessedContent] = useState('')
  const [previewInfo, setPreviewInfo] = useState<any>(null)
  const [guestSettings, setGuestSettings] = useState<any>(null)

  // 获取游客权限设置
  useEffect(() => {
    fetch('/api/v1/settings/guest-permissions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setGuestSettings(data.data)
          if (!session) {
            setPreviewPercentage(data.data.previewPercentage || 0)
          }
        }
      })
      .catch(error => console.error('获取游客权限设置失败:', error))
  }, [session])

  // 处理内容预览
  useEffect(() => {
    // 模拟用户组对象
    const mockUserGroup = {
      id: session ? 1 : 0,
      name: session ? '测试用户组' : '游客',
      previewPercentage: previewPercentage,
      permissions: JSON.stringify({
        video: previewPercentage >= 50 ? ['play'] : []
      })
    }

    const info = getContentPreviewInfoWithVideo(TEST_CONTENT, mockUserGroup)
    setProcessedContent(info.previewContent)
    setPreviewInfo(info)
  }, [previewPercentage, session])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">内容预览功能测试</h1>
          <p className="text-gray-600">
            此页面用于测试游客预览百分比功能是否正常工作
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 控制面板 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>测试控制</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预览百分比
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={previewPercentage}
                    onChange={(e) => setPreviewPercentage(parseInt(e.target.value) || 0)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    调整此值来测试不同的预览效果
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">当前状态</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">登录状态:</span>
                      <span className="ml-2 font-medium">
                        {session ? '已登录' : '未登录（游客）'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">预览百分比:</span>
                      <span className="ml-2 font-medium">{previewPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">完整访问:</span>
                      <span className="ml-2 font-medium">
                        {previewInfo?.hasFullAccess ? '是' : '否'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">内容受限:</span>
                      <span className="ml-2 font-medium">
                        {previewInfo?.isLimited ? '是' : '否'}
                      </span>
                    </div>
                  </div>
                </div>

                {guestSettings && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">游客权限设置</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">预览百分比:</span>
                        <span className="ml-2 font-medium">{guestSettings.previewPercentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">可以查看:</span>
                        <span className="ml-2 font-medium">
                          {guestSettings.canView ? '是' : '否'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">可以搜索:</span>
                        <span className="ml-2 font-medium">
                          {guestSettings.canSearch ? '是' : '否'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                    variant="outline"
                  >
                    刷新页面
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 内容预览 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>内容预览效果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                  
                  {/* 预览限制提示 */}
                  {previewInfo?.isLimited && (
                    <ContentPreviewLimit
                      previewPercentage={previewInfo.previewPercentage}
                      className="mt-8"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 原始内容对比 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>原始内容（仅供对比）</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-lg max-w-none opacity-50"
                  dangerouslySetInnerHTML={{ __html: TEST_CONTENT }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
