import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface NewApiKeyDisplayProps {
  newKeyData: {
    apiKey: string
  }
  onClose: () => void
}

export default function NewApiKeyDisplay({ newKeyData, onClose }: NewApiKeyDisplayProps) {
  const handleCopyKey = () => {
    navigator.clipboard.writeText(newKeyData.apiKey)
    alert('API密钥已复制到剪贴板')
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CardHeader>
        <CardTitle className="text-green-800 dark:text-green-200">
          🎉 API密钥创建成功
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-green-700 dark:text-green-300">
            请妥善保存以下API密钥，它只会显示一次：
          </p>
          <div className="bg-white dark:bg-dark-card p-3 rounded border font-mono text-sm break-all">
            {newKeyData.apiKey}
          </div>
          <Button
            size="sm"
            onClick={handleCopyKey}
          >
            复制密钥
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            我已保存
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
