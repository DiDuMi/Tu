import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface MediaTag {
  id: number
  uuid: string
  name: string
  description: string | null
  color: string | null
  createdAt: string
  updatedAt: string
}

interface TagTableProps {
  tags: MediaTag[]
  onEdit: (tag: MediaTag) => void
  onDelete: (tag: MediaTag) => void
}

export default function TagTable({ tags, onEdit, onDelete }: TagTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              标签名称
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              颜色
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              描述
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              创建时间
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {tags.map(tag => (
            <tr key={tag.uuid}>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color || '#3B82F6' }}
                  ></span>
                  <span className="font-medium">{tag.name}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {tag.color || '-'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {tag.description || '-'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(tag.createdAt).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(tag)}
                  className="mr-3 text-blue-600 hover:text-blue-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(tag)}
                  className="text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
