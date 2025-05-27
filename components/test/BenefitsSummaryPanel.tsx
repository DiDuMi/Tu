import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface BenefitItem {
  text: string
  icon: string
  color: string
}

interface BenefitsSectionProps {
  title: string
  titleColor: string
  iconColor: string
  items: string[]
}

function BenefitsSection({ title, titleColor, iconColor, items }: BenefitsSectionProps) {
  return (
    <div>
      <h4 className={`font-medium ${titleColor} mb-3`}>{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={iconColor}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NotesSection({ title, titleColor, iconColor, items }: BenefitsSectionProps) {
  return (
    <div>
      <h4 className={`font-medium ${titleColor} mb-3`}>{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={iconColor}>⚠</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function BenefitsSummaryPanel() {
  const performanceBenefits = [
    '自动图片格式优化 (WebP/AVIF)',
    '响应式图片和尺寸优化',
    '懒加载和优先级控制',
    '防止累积布局偏移 (CLS)',
    '内置图片压缩和缓存'
  ]

  const userExperienceBenefits = [
    '加载状态和进度指示',
    '错误处理和fallback图片',
    '自动重试机制',
    '更快的页面加载速度',
    '更稳定的布局表现'
  ]

  const developerExperienceBenefits = [
    '统一的图片处理API',
    '类型安全的属性定义',
    '内置性能监控和事件',
    '可配置的优化策略',
    '更好的调试和错误追踪'
  ]

  const considerations = [
    '需要明确指定图片尺寸',
    '外部域名需要配置白名单',
    '动态尺寸图片需要特殊处理',
    'CSS布局可能需要调整',
    '建议渐进式迁移'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>迁移收益总结</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BenefitsSection
            title="性能收益"
            titleColor="text-green-700"
            iconColor="text-green-600"
            items={performanceBenefits}
          />

          <BenefitsSection
            title="用户体验收益"
            titleColor="text-blue-700"
            iconColor="text-blue-600"
            items={userExperienceBenefits}
          />

          <BenefitsSection
            title="开发体验收益"
            titleColor="text-purple-700"
            iconColor="text-purple-600"
            items={developerExperienceBenefits}
          />

          <NotesSection
            title="注意事项"
            titleColor="text-orange-700"
            iconColor="text-orange-600"
            items={considerations}
          />
        </div>
      </CardContent>
    </Card>
  )
}
