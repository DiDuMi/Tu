import { useState, useEffect, useRef } from 'react'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useSession } from 'next-auth/react'
import { z } from 'zod'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import NewHomeSidebarLayout from '@/components/layout/NewHomeSidebarLayout'
import { useUserStore } from '@/stores/userStore'

// 表单验证模式
const profileSchema = z.object({
  name: z.string().min(2, '用户名至少需要2个字符').max(50, '用户名不能超过50个字符'),
  bio: z.string().max(200, '个人简介不能超过200个字符').optional(),
})

type FormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  // 使用Zustand状态管理
  const { user, isLoading: isUserLoading, error, fetchUserProfile, updateUserProfile, updateUserAvatar } = useUserStore()

  // 表单状态
  const [formData, setFormData] = useState<FormData>({
    name: '',
    bio: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 头像上传
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // 加载用户资料
  useEffect(() => {
    if (session) {
      fetchUserProfile()
    }
  }, [session, fetchUserProfile])

  // 更新表单数据
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin?callbackUrl=/dashboard/profile')
    }
  }, [session, isLoading, router])

  // 处理表单输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // 清除字段错误
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证表单
    try {
      profileSchema.parse(formData)
      setFormErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0]
          fieldErrors[field as string] = err.message
        })
        setFormErrors(fieldErrors)
        return
      }
    }

    // 提交表单
    try {
      setIsSubmitting(true)
      setSuccessMessage(null)

      await updateUserProfile(formData)

      setSuccessMessage('个人资料更新成功')

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error('更新个人资料失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理头像点击
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // 处理头像选择
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    // 验证文件大小（最大2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB')
      return
    }

    // 创建预览
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // 上传头像
    handleAvatarUpload(file)
  }

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploadingAvatar(true)

      await updateUserAvatar(file)

      setSuccessMessage('头像更新成功')

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error('上传头像失败:', error)
      setAvatarPreview(null)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (isLoading || isUserLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <NewHomeSidebarLayout>
      <Head>
        <title>个人资料 - 兔图</title>
        <meta name="description" content="编辑您的兔图个人资料" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">个人资料</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：头像 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>头像</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <div
                    className="relative h-32 w-32 rounded-full overflow-hidden cursor-pointer mb-4 border-2 border-gray-200 hover:border-primary-500"
                    onClick={handleAvatarClick}
                  >
                    {(avatarPreview || user?.avatar || user?.image) ? (
                      <Image
                        src={avatarPreview || user?.avatar || user?.image || ''}
                        alt={user?.name || '用户头像'}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-300 flex items-center justify-center text-4xl text-gray-600">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />

                  <Button
                    variant="outline"
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar ? '上传中...' : '更换头像'}
                  </Button>

                  <p className="mt-2 text-xs text-gray-500 text-center">
                    支持JPG、PNG格式，最大2MB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：个人资料表单 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    {error}
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="success" className="mb-4">
                    {successMessage}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        邮箱
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        邮箱地址不可修改
                      </p>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        用户名
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        error={formErrors.name}
                        disabled={isSubmitting}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-error-500">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        个人简介
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        className={`block w-full px-3 py-2 border ${
                          formErrors.bio ? 'border-error-500' : 'border-gray-300'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="介绍一下自己吧..."
                        value={formData.bio || ''}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      ></textarea>
                      {formErrors.bio && (
                        <p className="mt-1 text-sm text-error-500">{formErrors.bio}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 text-right">
                        {(formData.bio?.length || 0)}/200
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                      >
                        保存修改
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </NewHomeSidebarLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/dashboard/profile',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
