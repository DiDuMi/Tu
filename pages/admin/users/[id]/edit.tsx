import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { isAdmin } from '@/lib/permissions'
import { useForm } from '@/hooks/useForm'
import { useMutation } from '@/hooks/useFetch'
import { useFetch } from '@/hooks/useFetch'
import { z } from 'zod'
import { User, UserGroup } from '@/stores/adminUserStore'

// 表单验证模式
const updateUserSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z0-9])(?=.*[!@#$%^&*])/,
      '密码必须包含小写字母、大写字母或数字、特殊字符'
    )
    .optional()
    .or(z.literal('')),
  role: z.string().min(1, '请选择用户角色'),
  status: z.string().min(1, '请选择用户状态'),
  userGroupId: z.string().optional(),
})

type UpdateUserForm = z.infer<typeof updateUserSchema>

export default function EditUser() {
  const router = useRouter()
  const { id } = router.query
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  // 获取用户详情
  const { data: userData, error: userError, isLoading: userLoading } = useFetch<User>(
    mounted && id ? `/api/v1/users/${id}` : null
  )

  // 当用户数据加载完成后，设置用户信息
  useEffect(() => {
    if (userData?.success) {
      setUser(userData.data)
    }
  }, [userData])

  // 获取用户组列表
  const { data: userGroupsData } = useFetch<{ items: UserGroup[] }>(
    mounted ? '/api/v1/user-groups?limit=100' : null
  )

  // 更新用户的API调用
  const { put: updateUser, loading: updateLoading, error: updateError } = useMutation(`/api/v1/users/${id}`)

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
  } = useForm<UpdateUserForm>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      status: '',
      userGroupId: '',
    },
    validationSchema: updateUserSchema,
    onSubmit: async (values) => {
      try {
        // 转换userGroupId为数字或null
        const userGroupId = values.userGroupId ? parseInt(values.userGroupId) : null

        // 如果密码为空，则不更新密码
        const updateData = {
          ...values,
          userGroupId,
          password: values.password || undefined,
        }

        const result = await updateUser(updateData)

        if (result.success) {
          // 更新成功，跳转到用户详情页
          router.push(`/admin/users/${id}`)
        }
      } catch (error) {
        console.error('更新用户失败:', error)
      }
    },
  })

  // 当用户数据加载完成后，初始化表单
  useEffect(() => {
    if (user) {
      resetForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        status: user.status,
        userGroupId: user.userGroup?.id.toString() || '',
      })
    }
  }, [user, resetForm])

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (userLoading) {
    return (
      <AdminLayout title="编辑用户 - 兔图管理后台">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    )
  }

  if (userError || !user) {
    return (
      <AdminLayout title="编辑用户 - 兔图管理后台">
        <Alert variant="error">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription>
            {(userError instanceof Error ? userError.message : userError) || '无法加载用户信息，请稍后重试'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/admin/users">
            <Button>返回用户列表</Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={`编辑用户: ${user.name} - 兔图管理后台`}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">编辑用户</h1>
          <p className="mt-1 text-sm text-gray-500">
            编辑用户 ID: {user.id}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <Link href={`/admin/users/${id}`}>
            <Button variant="outline">
              查看详情
            </Button>
          </Link>
          <Link href="/admin/users">
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
            {typeof updateError === 'string'
              ? updateError
              : '更新用户时发生错误，请稍后重试'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="用户名"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && errors.name ? errors.name : undefined}
                required
              />
              <Input
                label="邮箱"
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && errors.email ? errors.email : undefined}
                required
              />
            </div>

            <Input
              label="密码"
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password ? errors.password : undefined}
              helperText="留空表示不修改密码。新密码必须包含小写字母、大写字母或数字、特殊字符"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="角色"
                name="role"
                value={values.role}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.role && errors.role ? errors.role : undefined}
                options={[
                  { value: 'REGISTERED', label: '注册用户' },
                  { value: 'MEMBER', label: '会员' },
                  { value: 'ANNUAL_MEMBER', label: '年度会员' },
                  { value: 'OPERATOR', label: '操作员' },
                  { value: 'ADMIN', label: '管理员' },
                ]}
                required
              />
              <Select
                label="状态"
                name="status"
                value={values.status}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.status && errors.status ? errors.status : undefined}
                options={[
                  { value: 'ACTIVE', label: '活跃' },
                  { value: 'PENDING', label: '待审核' },
                  { value: 'SUSPENDED', label: '已禁用' },
                ]}
                required
              />
            </div>

            <Select
              label="用户组"
              name="userGroupId"
              value={values.userGroupId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.userGroupId && errors.userGroupId ? errors.userGroupId : undefined}
              options={[
                { value: '', label: '选择用户组（可选）' },
                ...((userGroupsData as any)?.data?.items || []).map((group: any) => ({
                  value: group.id.toString(),
                  label: group.name,
                })),
              ]}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/users/${id}`)}
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
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/users',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
