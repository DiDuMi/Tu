import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface UserGroup {
  permissions?: Record<string, any> | null
}

interface UserPermissionsCardProps {
  userGroup?: UserGroup | null
}

export default function UserPermissionsCard({ userGroup }: UserPermissionsCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>权限信息</CardTitle>
      </CardHeader>
      <CardContent>
        {userGroup?.permissions ? (
          <div className="space-y-4">
            {Object.entries(userGroup.permissions).map(([resource, actions]) => (
              <div key={resource} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                  {resource} 权限
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(actions) ? actions.map((action) => (
                    <Badge key={action} variant="secondary" className="capitalize">
                      {action}
                    </Badge>
                  )) : (
                    <Badge variant="secondary">
                      {String(actions)}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">该用户暂无特定权限配置</p>
        )}
      </CardContent>
    </Card>
  )
}
