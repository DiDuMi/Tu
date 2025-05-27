import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface UserPoint {
  balance: number
  totalEarned: number
  totalSpent: number
}

interface UserPointsCardProps {
  userPoint?: UserPoint | null
}

export default function UserPointsCard({ userPoint }: UserPointsCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>用户积分</CardTitle>
      </CardHeader>
      <CardContent>
        {userPoint ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">当前积分</p>
              <p className="text-2xl font-bold text-primary-600">
                {userPoint.balance}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">累计获得</p>
              <p className="text-2xl font-bold text-success-600">
                {userPoint.totalEarned}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">累计消费</p>
              <p className="text-2xl font-bold text-warning-600">
                {userPoint.totalSpent}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">该用户暂无积分记录</p>
        )}
      </CardContent>
    </Card>
  )
}
