import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useAdminUserStore } from '@/stores/adminUserStore'
import { UserGroup } from '@/stores/adminUserStore'

interface AdvancedUserFilterProps {
  userGroups: UserGroup[]
  onSearch: () => void
}

export default function AdvancedUserFilter({ userGroups, onSearch }: AdvancedUserFilterProps) {
  const router = useRouter()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  
  // 从状态管理中获取筛选条件
  const {
    searchTerm,
    statusFilter,
    roleFilter,
    userGroupFilter,
    emailFilter,
    registrationDateStart,
    registrationDateEnd,
    sortField,
    sortDirection,
    setSearchTerm,
    setStatusFilter,
    setRoleFilter,
    setUserGroupFilter,
    setEmailFilter,
    setRegistrationDateRange,
    setSortField,
    setSortDirection,
    resetUserFilters,
    syncWithUrl,
    getQueryParams,
  } = useAdminUserStore()
  
  // 当URL参数变化时，同步到状态
  useEffect(() => {
    if (router.isReady) {
      syncWithUrl(new URLSearchParams(router.query as Record<string, string>))
    }
  }, [router.isReady, router.query, syncWithUrl])
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 更新URL参数
    const params = getQueryParams()
    router.push({
      pathname: router.pathname,
      query: params,
    }, undefined, { shallow: true })
    
    onSearch()
  }
  
  // 处理重置筛选
  const handleResetFilters = () => {
    resetUserFilters()
    
    // 更新URL参数
    router.push({
      pathname: router.pathname,
    }, undefined, { shallow: true })
    
    onSearch()
  }
  
  // 处理排序变化
  const handleSortChange = (field: string) => {
    if (sortField === field) {
      // 如果已经按此字段排序，则切换排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 否则，设置新的排序字段，默认降序
      setSortField(field)
      setSortDirection('desc')
    }
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>筛选条件</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          {isAdvancedOpen ? '收起高级筛选' : '展开高级筛选'}
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="搜索用户名或邮箱"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              options={[
                { value: '', label: '所有状态' },
                { value: 'ACTIVE', label: '活跃' },
                { value: 'PENDING', label: '待审核' },
                { value: 'SUSPENDED', label: '已禁用' },
              ]}
            />
            <Select
              value={roleFilter || ''}
              onChange={(e) => setRoleFilter(e.target.value || null)}
              options={[
                { value: '', label: '所有角色' },
                { value: 'ADMIN', label: '管理员' },
                { value: 'OPERATOR', label: '操作员' },
                { value: 'ANNUAL_MEMBER', label: '年度会员' },
                { value: 'MEMBER', label: '会员' },
                { value: 'REGISTERED', label: '注册用户' },
                { value: 'GUEST', label: '访客' },
              ]}
            />
            <div className="flex space-x-2">
              <Button type="submit" variant="default">
                搜索
              </Button>
              <Button type="button" variant="outline" onClick={handleResetFilters}>
                重置
              </Button>
            </div>
          </div>
          
          {isAdvancedOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium mb-3">高级筛选</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户组
                  </label>
                  <Select
                    value={userGroupFilter?.toString() || ''}
                    onChange={(e) => setUserGroupFilter(e.target.value ? parseInt(e.target.value) : null)}
                    options={[
                      { value: '', label: '所有用户组' },
                      ...userGroups.map(group => ({
                        value: group.id.toString(),
                        label: group.name
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    精确邮箱
                  </label>
                  <Input
                    placeholder="输入完整邮箱地址"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序方式
                  </label>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value)}
                      options={[
                        { value: 'createdAt', label: '注册时间' },
                        { value: 'name', label: '用户名' },
                        { value: 'email', label: '邮箱' },
                        { value: 'role', label: '角色' },
                        { value: 'status', label: '状态' },
                      ]}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortDirection === 'asc' ? '升序' : '降序'}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    注册时间范围
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={registrationDateStart || ''}
                      onChange={(e) => setRegistrationDateRange(e.target.value || null, registrationDateEnd)}
                    />
                    <span>至</span>
                    <Input
                      type="date"
                      value={registrationDateEnd || ''}
                      onChange={(e) => setRegistrationDateRange(registrationDateStart, e.target.value || null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
