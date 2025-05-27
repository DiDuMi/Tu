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
import { useFetch, useMutation } from '@/hooks/useFetch'
import { useForm } from '@/hooks/useForm'
import { isAdmin } from '@/lib/permissions'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { UserGroup } from '@/stores/adminUserStore'

// 表单验证模式
const updateUserGroupSchema = z.object({
  name: z.string().min(2, '名称至少需要2个字符').max(50, '名称不能超过50个字符'),
  description: z.string().optional(),
  previewPercentage: z.number().min(0, '预览百分比不能小于0').max(100, '预览百分比不能大于100'),
  maxFileSize: z.number().min(0, '最大文件大小不能小于0').optional(),
  allowedTypes: z.string().optional(),
})

type UpdateUserGroupForm = z.infer<typeof updateUserGroupSchema>

export default function EditUserGroup() {
  const router = useRouter()
  const { id } = router.query
  const [mounted, setMounted] = useState(false)
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null)

  // 获取用户组详情
  const { data: groupData, error: groupError, isLoading: groupLoading } = useFetch<UserGroup>(
    mounted && id ? `/api/v1/user-groups/${id}` : null
  )

  // 当数据加载完成后，设置用户组信息
  useEffect(() => {
    if (groupData?.success) {
      setUserGroup(groupData.data)
      // 确保权限配置包含所有必要的字段
      let permissions: Record<string, string[]> = {}

      try {
        // 如果permissions是字符串，尝试解析
        if (typeof groupData.data.permissions === 'string') {
          const parsed = JSON.parse(groupData.data.permissions)
          permissions = normalizePermissions(parsed)
        } else if (typeof groupData.data.permissions === 'object' && groupData.data.permissions !== null) {
          permissions = normalizePermissions(groupData.data.permissions)
        }
      } catch (error) {
        console.error('解析权限数据失败:', error)
        permissions = {}
      }

      console.log('加载的权限数据:', permissions)
      setPermissions(permissions)
    }
  }, [groupData])

  // 标准化权限数据，确保所有值都是字符串数组
  const normalizePermissions = (perms: any): Record<string, string[]> => {
    const normalized: Record<string, string[]> = {}

    if (typeof perms === 'object' && perms !== null) {
      Object.keys(perms).forEach(key => {
        const value = perms[key]
        if (Array.isArray(value)) {
          // 如果已经是数组，直接使用
          normalized[key] = value.filter(item => typeof item === 'string')
        } else if (typeof value === 'boolean' && value) {
          // 如果是true，转换为包含key的数组
          normalized[key] = [key]
        } else if (typeof value === 'string') {
          // 如果是字符串，转换为数组
          normalized[key] = [value]
        } else if (typeof value === 'object' && value !== null) {
          // 如果是对象，提取为true的键
          const actions = Object.keys(value).filter(action => value[action] === true)
          if (actions.length > 0) {
            normalized[key] = actions
          }
        }
      })
    }

    return normalized
  }

  // 更新用户组的API调用
  const { put: updateUserGroup, loading: updateLoading, error: updateError } = useMutation(`/api/v1/user-groups/${id}`)

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
    resetForm,
  } = useForm<UpdateUserGroupForm>({
    initialValues: {
      name: '',
      description: '',
      previewPercentage: 0, // 初始值设为0，等待数据加载
      maxFileSize: 10485760, // 10MB
      allowedTypes: '',
    },
    validationSchema: updateUserGroupSchema,
    onSubmit: async (values) => {
      try {
        console.log('提交表单数据:', values)
        console.log('权限配置:', permissions)

        // 解析允许的文件类型
        const allowedTypes = values.allowedTypes
          ? values.allowedTypes.split(',').map(type => type.trim()).filter(Boolean)
          : undefined

        // 构建上传限制
        const uploadLimits = {
          maxFileSize: values.maxFileSize,
          allowedTypes,
        }

        const payload = {
          name: values.name,
          description: values.description || undefined,
          permissions,
          uploadLimits,
          previewPercentage: values.previewPercentage,
        }

        console.log('发送的请求数据:', payload)

        const result = await updateUserGroup(payload)

        if (result.success) {
          console.log('更新成功，跳转到详情页')
          // 更新成功，跳转到用户组详情页
          router.push(`/admin/user-groups/${id}`)
        } else {
          console.error('更新失败:', result)
        }
      } catch (error) {
        console.error('更新用户组失败:', error)
        // 错误已经通过useMutation的error状态处理
      }
    },
  })

  // 当用户组数据加载完成后，初始化表单
  useEffect(() => {
    if (userGroup) {
      const formData = {
        name: userGroup.name,
        description: userGroup.description || '',
        previewPercentage: userGroup.previewPercentage,
        maxFileSize: userGroup.uploadLimits?.maxFileSize || 10485760,
        allowedTypes: userGroup.uploadLimits?.allowedTypes?.join(',') || '',
      }
      resetForm(formData)
    }
  }, [userGroup]) // 移除resetForm依赖，避免循环

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (groupLoading) {
    return (
      <AdminLayout title="编辑用户组 - 兔图管理后台">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (groupError || !userGroup) {
    return (
      <AdminLayout title="编辑用户组 - 兔图管理后台">
        <Alert variant="error">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {(groupError instanceof Error ? groupError.message : groupError) || '无法加载用户组信息，请稍后重试'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/user-groups">
            <Button>返回用户组列表</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`编辑用户组: ${userGroup.name} - 兔图管理后台`}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编辑用户组</h1>
          <p className="mt-1 text-sm text-gray-500">
            编辑用户组 ID: {userGroup.id}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Link href={`/admin/user-groups/${id}`}>
            <Button variant="outline">
              查看详情
            </Button>
          </Link>
          <Link href="/admin/user-groups">
            <Button variant="outline">
              返回列表
            </Button>
          </Link>
        </div>
      </div>

      {updateError && (
        <Alert variant="error" className="mb-6">
          <AlertTitle>更新失败</AlertTitle>
          <AlertDescription>
            {updateError instanceof Error
              ? updateError.message
              : typeof updateError === 'string'
              ? updateError
              : '更新用户组时发生错误，请稍后重试'}
          </AlertDescription>
        </Alert>
      )}



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
              onClick={() => router.push(`/admin/user-groups/${id}`)}
            >
              取消
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || updateLoading}
              disabled={isSubmitting || updateLoading}
            >
              保存更改
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
        destination: '/auth/signin?callbackUrl=/admin/user-groups',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
