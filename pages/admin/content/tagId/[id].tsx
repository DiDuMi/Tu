import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import ContentList from '@/components/content/ContentList'
import AdminLayout from '@/components/layout/AdminLayout'
import { useContentManagement } from '@/hooks/useContentManagement'
import { useFetch } from '@/hooks/useFetch'

const ContentByTagPage: NextPage = () => {
  const router = useRouter()
  const { id } = router.query
  const contentManagement = useContentManagement()
  const { setTagId } = contentManagement

  // 获取标签信息
  const { data: tagData } = useFetch<{ success: boolean, data: { id: number, name: string } }>(
    id ? `/api/v1/tags/${id}` : null
  )

  // 设置标签ID筛选
  useEffect(() => {
    if (id && typeof id === 'string') {
      setTagId(parseInt(id))
    }
  }, [id, setTagId])

  const tagName = tagData?.success && tagData.data ? tagData.data.name : '加载中...'

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">标签内容: {tagName}</h1>
          <p className="text-gray-600">查看与此标签相关的所有内容</p>
        </div>

        <ContentList
          pages={contentManagement.pages}
          totalPages={contentManagement.totalPages}
          currentPage={contentManagement.currentPage}
          pageSize={contentManagement.pageSize}
          isLoading={contentManagement.isLoading}
          error={contentManagement.error}
          onPageChange={contentManagement.handlePageChange}
          onDelete={contentManagement.handleDeletePage}
        />
      </div>
    </AdminLayout>
  )
}

export default ContentByTagPage
