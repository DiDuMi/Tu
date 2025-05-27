import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

import { useABTest } from './ABTestProvider'

interface MigrationExampleCardProps {
  title: string
  variant?: string
  children: React.ReactNode
}

export default function MigrationExampleCard({ 
  title, 
  variant,
  children 
}: MigrationExampleCardProps) {
  const { variant: abVariant } = useABTest('image-component')
  const currentVariant = variant || abVariant

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-600">
          当前变体: {currentVariant || '未分配'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}

// 迁移前后对比容器
export function MigrationComparison({ 
  beforeTitle = "迁移前", 
  afterTitle = "迁移后",
  beforeContent,
  afterContent,
  beforeIssues,
  afterBenefits
}: {
  beforeTitle?: string
  afterTitle?: string
  beforeContent: React.ReactNode
  afterContent: React.ReactNode
  beforeIssues?: string
  afterBenefits?: string
}) {
  return (
    <>
      {/* 迁移前 */}
      <div>
        <h4 className="font-medium mb-3">{beforeTitle}</h4>
        {beforeContent}
        {beforeIssues && (
          <div className="mt-2 text-xs text-gray-500">
            <p>问题: {beforeIssues}</p>
          </div>
        )}
      </div>

      {/* 迁移后 */}
      <div>
        <h4 className="font-medium mb-3">{afterTitle}</h4>
        {afterContent}
        {afterBenefits && (
          <div className="mt-2 text-xs text-green-600">
            <p>{afterBenefits}</p>
          </div>
        )}
      </div>
    </>
  )
}
