import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface UserApplicationCardProps {
  applicationReason?: string
}

export default function UserApplicationCard({ applicationReason }: UserApplicationCardProps) {
  if (!applicationReason) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>申请原因</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {applicationReason}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          用户在注册时提供的申请原因，可作为审核参考
        </p>
      </CardContent>
    </Card>
  )
}
