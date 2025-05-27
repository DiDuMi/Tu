import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface LogFiltersProps {
  filters: {
    level: string
    module: string
    action: string
    startDate: string
    endDate: string
  }
  onFilterChange: (key: string, value: string) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  onClearLogs: () => void
}

export default function LogFilters({
  filters,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onClearLogs
}: LogFiltersProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>日志筛选</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日志级别
            </label>
            <Select
              value={filters.level}
              onChange={(e) => onFilterChange('level', e.target.value)}
            >
              <option value="">全部级别</option>
              <option value="INFO">信息</option>
              <option value="WARNING">警告</option>
              <option value="ERROR">错误</option>
              <option value="CRITICAL">严重错误</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模块
            </label>
            <Input
              type="text"
              value={filters.module}
              onChange={(e) => onFilterChange('module', e.target.value)}
              placeholder="输入模块名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              操作类型
            </label>
            <Input
              type="text"
              value={filters.action}
              onChange={(e) => onFilterChange('action', e.target.value)}
              placeholder="输入操作类型"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始日期
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束日期
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <div className="flex space-x-2">
            <Button onClick={onApplyFilters}>应用筛选</Button>
            <Button variant="outline" onClick={onResetFilters}>重置</Button>
          </div>

          <Button
            variant="destructive"
            onClick={onClearLogs}
          >
            清除日志
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
