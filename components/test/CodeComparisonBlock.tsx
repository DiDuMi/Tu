interface CodeComparisonBlockProps {
  beforeCode: string
  afterCode: string
  beforeTitle?: string
  afterTitle?: string
}

export default function CodeComparisonBlock({
  beforeCode,
  afterCode,
  beforeTitle = "迁移前",
  afterTitle = "迁移后"
}: CodeComparisonBlockProps) {
  return (
    <div>
      <h4 className="font-medium mb-3">代码对比</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-red-700 mb-2">{beforeTitle}</h5>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {beforeCode}
          </pre>
        </div>
        <div>
          <h5 className="text-sm font-medium text-green-700 mb-2">{afterTitle}</h5>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
            {afterCode}
          </pre>
        </div>
      </div>
    </div>
  )
}
