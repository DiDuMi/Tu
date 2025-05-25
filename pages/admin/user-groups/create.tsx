import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import AdminLayout from '@/components/layout/AdminLayout'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import PermissionSelector from '@/components/user-groups/PermissionSelector'
import { useMutation } from '@/hooks/useFetch'
import { useForm } from '@/hooks/useForm'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// 表单验证模式
const createUserGroupSchema = z.object({
  name: z.string().min(2, '名称至少需要2个字符').max(50, '名称不能超过50个字符'),
  description: z.string().optional(),
  previewPercentage: z.number().min(0, '预览百分比不能小于0').max(100, '预览百分比不能大于100'),
  maxFileSize: z.number().min(0, '最大文件大小不能小于0').optional(),
  allowedTypes: z.string().optional(),
})

type CreateUserGroupForm = z.infer<typeof createUserGroupSchema>

export default function CreateUserGroup() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    users: ['read'],
    pages: ['read'],
    media: ['read'],
  })

  // 创建用户组的API调用
  const { post: createUserGroup, loading: createLoading, error: createError } = useMutation('/api/v1/user-groups')

  // 表单处理
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useForm<CreateUserGroupForm>({
    initialValues: {
      name: '',
      description: '',
      previewPercentage: 100,
      maxFileSize: 10485760, // 10MB
      allowedTypes: 'image/*,video/*',
    },
    validationSchema: createUserGroupSchema,
    onSubmit: async (values) => {
      try {
        // 解析允许的文件类型
        const allowedTypes = values.allowedTypes
          ? values.allowedTypes.split(',').map(type => type.trim()).filter(Boolean)
          : undefined

        // 构建上传限制
        const uploadLimits = {
          maxFileSize: values.maxFileSize,
          allowedTypes,
        }

        const result = await createUserGroup({
          name: values.name,
          description: values.description || undefined,
          permissions,
          uploadLimits,
          previewPercentage: values.previewPercentage,
        })

        if (result.success) {
          // 创建成功，清除SWR缓存并跳转到用户组列表页
          const { mutate } = await import('swr');

          // 全局缓存失效，确保所有用户组相关的API请求都会重新获取数据
          await mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/v1/user-groups'),
            undefined,
            { revalidate: true }
          );

          // 显示成功消息
          alert('用户组创建成功！');

          // 跳转到用户组列表页
          router.push('/admin/user-groups');
        }
      } catch (error) {
        console.error('创建用户组失败:', error)
      }
    },
  })

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AdminLayout title="创建用户组 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">创建用户组</h1>
          <p className="mt-1 text-sm text-gray-500">
            添加新用户组到系统
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/admin/user-groups">
            <Button variant="outline">
              返回用户组列表
            </Button>
          </Link>
        </div>
      </div>

      {createError && (
        <Alert variant="error" className="mb-6">
          <AlertTitle>创建失败</AlertTitle>
          <AlertDescription>
            {typeof createError === 'string'
              ? createError
              : '创建用户组时发生错误，请稍后重试'}
          </AlertDescription>
        </Alert>
      )}

      {/* 游客权限说明 */}
      <Alert variant="info" className="mb-6">
        <AlertTitle className="flex items-center">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          关于游客权限
        </AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            <strong>游客</strong>（未登录用户）不属于任何用户组，他们的权限需要单独配置。
          </p>
          <p>
            如需管理游客权限，请访问{' '}
            <Link href="/admin/settings/guest-permissions" className="text-blue-600 hover:text-blue-800 underline">
              游客权限设置页面
            </Link>
          </p>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="用户组名称"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && errors.name ? errors.name : undefined}
                required
              />

              <Textarea
                label="描述"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description && errors.description ? errors.description : undefined}
                rows={4}
              />

              <Input
                label="预览百分比"
                type="number"
                name="previewPercentage"
                value={values.previewPercentage.toString()}
                onChange={(e) => setFieldValue('previewPercentage', parseInt(e.target.value) || 0)}
                onBlur={handleBlur}
                error={touched.previewPercentage && errors.previewPercentage ? errors.previewPercentage : undefined}
                helperText="设置用户可以预览内容的百分比，100%表示可以查看全部内容"
                min={0}
                max={100}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>上传限制</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="最大文件大小 (字节)"
                type="number"
                name="maxFileSize"
                value={values.maxFileSize?.toString() || ''}
                onChange={(e) => setFieldValue('maxFileSize', parseInt(e.target.value) || 0)}
                onBlur={handleBlur}
                error={touched.maxFileSize && errors.maxFileSize ? errors.maxFileSize : undefined}
                helperText="设置用户可以上传的最大文件大小，默认为10MB (10485760字节)"
                min={0}
              />

              <Input
                label="允许的文件类型"
                name="allowedTypes"
                value={values.allowedTypes || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.allowedTypes && errors.allowedTypes ? errors.allowedTypes : undefined}
                helperText="设置用户可以上传的文件类型，多个类型用逗号分隔，例如：image/*,video/*,application/pdf"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>权限配置</CardTitle>
            </CardHeader>
            <CardContent>
              <PermissionSelector
                permissions={permissions}
                onChange={setPermissions}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/user-groups')}
            >
              取消
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createLoading}
              disabled={isSubmitting || createLoading}
            >
              创建用户组
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/user-groups/create',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
