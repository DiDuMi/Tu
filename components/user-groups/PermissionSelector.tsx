import { useState } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface PermissionSelectorProps {
  permissions: Record<string, string[]>
  onChange: (permissions: Record<string, string[]>) => void
}

// 可用的资源和操作
const RESOURCES = [
  { id: 'users', name: '用户管理' },
  { id: 'pages', name: '内容管理' },
  { id: 'media', name: '媒体管理' },
  { id: 'video', name: '视频播放' },
  { id: 'homepage', name: '首页分类发布' },
  { id: 'settings', name: '系统设置' },
]

const ACTIONS = [
  { id: 'create', name: '创建' },
  { id: 'read', name: '查看' },
  { id: 'update', name: '更新' },
  { id: 'delete', name: '删除' },
  { id: 'play', name: '播放' },
]

// 首页分类权限操作定义
const HOMEPAGE_ACTIONS = [
  { id: 'featured', name: '精选内容' },
  { id: 'latest', name: '近期流出' },
  { id: 'archive', name: '往期补档' },
  { id: 'trending', name: '热门推荐' },
]

export default function PermissionSelector({ permissions, onChange }: PermissionSelectorProps) {
  // 处理权限变更
  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    const newPermissions = { ...permissions }

    // 如果资源不存在，创建一个空数组
    if (!newPermissions[resource]) {
      newPermissions[resource] = []
    }

    if (checked) {
      // 添加权限
      if (!newPermissions[resource].includes(action)) {
        newPermissions[resource] = [...newPermissions[resource], action]
      }
    } else {
      // 移除权限
      newPermissions[resource] = newPermissions[resource].filter(a => a !== action)

      // 如果资源没有任何权限，删除该资源
      if (newPermissions[resource].length === 0) {
        delete newPermissions[resource]
      }
    }

    onChange(newPermissions)
  }

  // 检查权限是否已选中
  const isPermissionChecked = (resource: string, action: string): boolean => {
    return permissions[resource]?.includes(action) || false
  }

  // 获取资源可用的操作
  const getAvailableActions = (resourceId: string) => {
    if (resourceId === 'video') {
      // 视频播放权限只显示播放操作
      return ACTIONS.filter(action => action.id === 'play')
    }
    if (resourceId === 'homepage') {
      // 首页分类权限显示专门的首页分类操作
      return HOMEPAGE_ACTIONS
    }
    // 其他资源显示除播放外的所有操作
    return ACTIONS.filter(action => action.id !== 'play')
  }

  return (
    <div className="space-y-6">
      {RESOURCES.map((resource) => {
        const availableActions = getAvailableActions(resource.id)

        return (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle className="text-lg">{resource.name}</CardTitle>
              {resource.id === 'video' && (
                <p className="text-sm text-gray-600">
                  控制用户组是否可以播放视频内容，有助于降低服务器带宽成本
                </p>
              )}
              {resource.id === 'homepage' && (
                <p className="text-sm text-gray-600">
                  控制用户组可以发布内容到哪些首页分类。只有拥有相应权限的用户才能将内容发布到对应的首页分类中。
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableActions.map((action) => (
                  <Checkbox
                    key={`${resource.id}-${action.id}`}
                    id={`${resource.id}-${action.id}`}
                    label={action.name}
                    checked={isPermissionChecked(resource.id, action.id)}
                    onChange={(e) => handlePermissionChange(
                      resource.id,
                      action.id,
                      e.target.checked
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
