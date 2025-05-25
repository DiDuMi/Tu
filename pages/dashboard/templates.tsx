import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ContentTemplateManager from '@/components/content/templates/ContentTemplateManager'

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isLoading = status === 'loading'

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/dashboard/templates')
    return null
  }

  return (
    <DashboardLayout title="模板管理 - 兔图">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
          <p className="mt-1 text-gray-500">管理您的内容模板，提高创作效率</p>
        </div>

        <ContentTemplateManager
          showCreateButton={true}
          compact={false}
          enableSorting={true}
        />
      </div>
    </DashboardLayout>
  )
}
