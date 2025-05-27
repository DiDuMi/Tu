import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface UserGroupPermissionsProps {
  permissions?: Record<string, string[]> | null
}

export default function UserGroupPermissions({ permissions }: UserGroupPermissionsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>权限配置</CardTitle>
      </CardHeader>
      <CardContent>
        {permissions && Object.keys(permissions).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(permissions).map(([resource, actions]) => (
              <div key={resource} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                  {resource} 权限
                </h4>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Badge key={action} variant="secondary" className="capitalize">
                      {action}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">该用户组暂无权限配置</p>
        )}
      </CardContent>
    </Card>
  )
}
